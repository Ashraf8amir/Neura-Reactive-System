const paymentHelper = require('./payment.helper');
const Payment = require('./payment.model');
const paymob = require('../../config/paymob');
const { paymentConstants } = require('./payment.constant');
const { appointmentConstants } = require('../appointments/appointment.constant');
const User = require('../../shared/models/user.model');
const Appointment = require('../appointments/appointment.model');
const { ROLE } = require('../../shared/constants/enums.js');


class PaymentService {
    async getBillingData(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found for billing data');
        }

        return {
            apartment: "NA",
            email: user.email,
            floor: "NA",
            first_name: user.firstName,
            last_name: user.lastName,
            phone_number: user.phone,
            street: user.address?.street || "NA",
            building: "NA",
            shipping_method: "NA",
            postal_code: "NA",
            city: user.address?.city || "Cairo",
            country: "EG",
            state: user.address?.governorate || "Cairo"
        };
    }



    async initiatePaymentService(paymentData){
        const {
            payerId,
            payerRole,
            receiverId,
            receiverRole,
            transactionType,
            amount,
            paymentMethod,
            referenceId, 
            metadata
        } = paymentData;

        const commission = paymentHelper.calculateCommission(amount, receiverRole);

        const payment = await Payment.create({
            payer: {
                user: payerId,
                role: payerRole
            },
            receiver: {
                user: receiverId,
                role: receiverRole
            },
            transactionType: transactionType,
            amount: {
                total: amount
            },
            commission: commission,
            paymentMethod: paymentMethod,
            status: paymentConstants.STATUS.PENDING,
            metadata: metadata
        });

        if (transactionType === paymentConstants.TRANSACTION_TYPES.APPOINTMENT) {
            payment.appointment = referenceId;
        } else if (transactionType === paymentConstants.TRANSACTION_TYPES.NURSING_SERVICE) {
            payment.nursingService = referenceId;
        } else if (transactionType === paymentConstants.TRANSACTION_TYPES.MEDICINE_PURCHASE) {
            payment.medicineOrder = referenceId;
        }

        await payment.save();

         if (paymentMethod === paymentConstants.PAYMENT_METHODS.CARD || paymentMethod === paymentConstants.PAYMENT_METHODS.WALLET) {
            const billingData = await this.getBillingData(payerId);

            const paymobResponse = await paymob.initiatePayment({
                amount: amount,
                currency: 'EGP',
                paymentMethod: paymentMethod,
                billingData: billingData
            });

            payment.paymob.orderId = paymobResponse.orderId;
            payment.paymob.paymentToken = paymobResponse.paymentToken;
            payment.status = paymentConstants.STATUS.PROCESSING;
            await payment.save();

            return {
                paymentId: payment._id,
                iframeUrl: paymobResponse.iframeUrl,
                paymentToken: paymobResponse.paymentToken
            };
        }

        return {
            paymentId: payment._id,
            status: payment.status
        };
    }

    async initiateAppointmentPaymentService(patientId, appointmentId, paymentMethod, amount) {
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctor patient');

        if (!appointment) {
            throw new AppError(404, httpStatus.FAIL, 'Appointment not found');
        }

        if (appointment.patient._id.toString() !== patientId) {
            throw new AppError(403, httpStatus.FAIL, 'Unauthorized');
        }

        return await this.initiatePaymentService({
            payerId: patientId,
            payerRole: ROLE.PATIENT,
            receiverId: appointment.doctor._id,
            receiverRole: ROLE.DOCTOR,
            transactionType: paymentConstants.TRANSACTION_TYPES.APPOINTMENT,
            amount: amount,
            paymentMethod: paymentMethod,
            referenceId: appointmentId,
            metadata: {
                description: `Appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
                appointmentDate: appointment.scheduledDate
            }
        });
    }

    async getPaymentsByRoleService(userId, userRole, filters = {}) {
        let query;

        if (userRole === ROLE.PATIENT) {
            query = { 'payer.user': userId };
        } else if ([ROLE.DOCTOR, ROLE.NURSE, ROLE.PHARMACY].includes(userRole)) {
            query = { 'receiver.user': userId };
        } else {
            throw new AppError(403, httpStatus.FAIL, 'Invalid role');
        }

        if (filters.status) query.status = filters.status;
        if (filters.transactionType) query.transactionType = filters.transactionType;
        if (filters.dateFrom) {
            query.createdAt = { $gte: new Date(filters.dateFrom) };
        }
        if (filters.dateTo) {
            query.createdAt = {
                ...query.createdAt,
                $lte: new Date(filters.dateTo)
            };
        }

        const payments = await Payment.find(query)
            .populate('payer.user', 'firstName lastName email')
            .populate('receiver.user', 'firstName lastName email')
            .populate('appointment')
            .populate('nursingService')
            .populate('medicineOrder')
            .sort({ createdAt: -1 })
            .limit(filters.limit || 50);

        return payments;
    }

     async getRevenueSummaryService(userId, userRole) {
        const payments = await Payment.find({
            'receiver.user': userId,
            status: 'completed'
        });

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount.total, 0);
        const platformCommission = payments.reduce((sum, p) => sum + (p.commission?.amount || 0), 0);
        const netRevenue = payments.reduce((sum, p) => sum + (p.commission?.receiverAmount || 0), 0);

        const settledAmount = payments
            .filter(p => p.settlement?.settled)
            .reduce((sum, p) => sum + (p.commission?.receiverAmount || 0), 0);

        const pendingSettlement = netRevenue - settledAmount;

        return {
            totalRevenue,
            platformCommission,
            netRevenue,
            settledAmount,
            pendingSettlement,
            totalTransactions: payments.length
        };
    }

    async settlePaymentsService(adminId, receiverId, paymentIds, bankReference) {
        const payments = await Payment.find({
            _id: { $in: paymentIds },
            'receiver.user': receiverId,
            status: 'completed',
            'settlement.settled': false
        });

        if (payments.length === 0) {
            throw new AppError(404, httpStatus.FAIL, 'No payments found to settle');
        }

        const totalAmount = payments.reduce(
            (sum, p) => sum + (p.commission?.receiverAmount || 0),
            0
        );

        const updatePromises = payments.map(payment => {
            payment.settlement = {
                settled: true,
                settledAt: new Date(),
                settledBy: adminId,
                bankTransferReference: bankReference
            };
            return payment.save();
        });

        await Promise.all(updatePromises);

        return {
            settledPayments: payments.length,
            totalAmount: totalAmount,
            bankReference: bankReference
        };
    }

    async handlePaymobCallbackService(callbackData) {
        const processedData = paymob.processCallback(callbackData);

        const payment = await Payment.findOne({
            'paymob.orderId': processedData.orderId
        }).populate('appointment nursingService medicineOrder');

        if (!payment) {
            throw new AppError(404, httpStatus.FAIL, 'Payment not found');
        }

        payment.paymob.transactionId = processedData.transactionId;
        payment.paymob.response = callbackData;

        if (processedData.success && !processedData.pending) {
            payment.status = paymentConstants.STATUS.COMPLETED;
            payment.paidAt = new Date();

            if (payment.appointment) {
                payment.appointment.payment.paid = true;
                payment.appointment.payment.paidAt = new Date();
                payment.appointment.status = appointmentConstants.APPOINTMENT_STATUSES.CONFIRMED;
                await payment.appointment.save();
            }
            if (payment.nursingService) {
                payment.nursingService.payment.paid = true;
                payment.nursingService.payment.paidAt = new Date();
                await payment.nursingService.save();
            }
            if (payment.medicineOrder) {
                payment.medicineOrder.payment.paid = true;
                payment.medicineOrder.payment.paidAt = new Date();
                await payment.medicineOrder.save();
            }
        } else if (processedData.pending) {
            payment.status = paymentConstants.STATUS.PROCESSING;
        } else {
            payment.status = paymentConstants.STATUS.FAILED;
            payment.failedAt = new Date();
            payment.error.message = 'Payment failed';
        }

        await payment.save();
        return payment;
    }
}

module.exports = new PaymentService();