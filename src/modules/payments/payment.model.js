const mongoose = require('mongoose');
const { ROLE } = require('../../shared/constants/enums.js');
const { paymentConstants } = require('./payment.constant');


const paymentSchema = new mongoose.Schema({
    payer: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: [ROLE.PATIENT, ROLE.DOCTOR, ROLE.NURSE, ROLE.PHARMACY, ROLE.ADMIN],
            required: true
        }
    },

    receiver: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: [ROLE.DOCTOR, ROLE.NURSE, ROLE.PHARMACY, ROLE.PLATFORM],
            required: true
        }
    },

    transactionType: {
        type: String,
        enum: Object.values(paymentConstants.TRANSACTION_TYPES),
        required: true
    },

    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    nursingService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NursingService'
    },
    medicineOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicineOrder'
    },

    amount: {
        total: {
            type: Number,
            required: true,
            min: [0, 'Amount cannot be negative']
        },
        subtotal: Number,
        tax: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 0 }
    },

    currency: {
        type: String,
        default: 'EGP',
        uppercase: true
    },

    commission: {
        percentage: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        receiverAmount: Number 
    },

    paymob: {
        orderId: String,
        transactionId: String,
        paymentToken: String,
        response: mongoose.Schema.Types.Mixed
    },

    paymentMethod: {
        type: String,
        enum: Object.values(paymentConstants.PAYMENT_METHODS),
        required: true
    },

    status: {
        type: String,
        enum: Object.values(paymentConstants.STATUS),
        default: paymentConstants.STATUS.PENDING
    },

    paidAt: Date,
    failedAt: Date,
    refundedAt: Date,

    settlement: {
        settled: { type: Boolean, default: false },
        settledAt: Date,
        settledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        bankTransferReference: String,
        notes: String
    },

    refund: {
        refundId: String,
        amount: Number,
        reason: String,
        refundedAt: Date,
        refundedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    error: {
        message: String,
        code: String
    },

    metadata: {
        description: String,
        notes: String,
        additionalInfo: mongoose.Schema.Types.Mixed
    }

}, {
    timestamps: true
});

paymentSchema.index({ 'payer.user': 1, createdAt: -1 });
paymentSchema.index({ 'receiver.user': 1, createdAt: -1 });
paymentSchema.index({ transactionType: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'paymob.orderId': 1 });
paymentSchema.index({ 'paymob.transactionId': 1 });
paymentSchema.index({ 'settlement.settled': 1 });

paymentSchema.virtual('platformRevenue').get(function() {
    return this.commission?.amount || 0;
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;