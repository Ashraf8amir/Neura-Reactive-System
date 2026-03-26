const MedicalRecord = require('./medicalRecord.model');
const Appointment = require('../appointments/appointment.model');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const { getPagination } = require('../../shared/utils/globalHelper');
const MedicalRecordHelper = require('./medicalRecord.helper');

class MedicalRecordService {
    
    async createRecord(doctorId, data) {
        const { appointmentId, aiSummary, doctorNotes, isVisibleToPatient } = data;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Appointment not found');
        }

        if (appointment.doctor.toString() !== doctorId) {
            throw new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN, 'You can only create records for your own appointments');
        }

        const medicalRecord = await MedicalRecord.create({
            appointmentId,
            patientId: appointment.patient,
            doctorId,
            aiSummary,
            doctorNotes: doctorNotes || '',
            isVisibleToPatient: isVisibleToPatient !== undefined ? isVisibleToPatient : true
        });

        return MedicalRecordHelper.formatResponse(medicalRecord);
    }

    async getPatientOwnRecords(patientId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const query = {
            patientId,
            isVisibleToPatient: true
        };

        const [records, total] = await Promise.all([
            MedicalRecord.find(query)
                .sort({ visitDate: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('doctorId', 'firstName lastName professionalInfo.primarySpecialization')
                .populate('appointmentId', 'appointmentNumber scheduledDate appointmentType clinic.clinicName')
                .lean(),
            MedicalRecord.countDocuments(query)
        ]);

        const strippedRecords = MedicalRecordHelper.stripDrugInteractionsFromArray(records);

        return {
            data: strippedRecords,
            pagination: getPagination(total, page, limit)
        };
    }

    async getRecordById(recordId, user) {
        const record = await MedicalRecord.findById(recordId)
            .populate('patientId', 'firstName lastName dateOfBirth gender')
            .populate('doctorId', 'firstName lastName professionalInfo.primarySpecialization')
            .populate('appointmentId', 'appointmentNumber scheduledDate appointmentType clinic.clinicName')
            .lean();

        if (!record) {
            throw new AppError(404, HTTP_STATUS_TEXT.NOT_FOUND, 'Medical record not found');
        }

        if (user.role === 'patient') {
            if (record.patientId._id.toString() !== user.id) {
                throw new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN, 'You can only view your own records');
            }

            if (!record.isVisibleToPatient) {
                throw new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN, 'This record is not visible to you');
            }

            return MedicalRecordHelper.stripDrugInteractions(record);
        }

        return record;
    }

    async getPatientHistoryForDoctor(patientId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const query = { patientId };

        const [records, total] = await Promise.all([
            MedicalRecord.find(query)
                .sort({ visitDate: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('doctorId', 'firstName lastName professionalInfo.primarySpecialization')
                .populate('appointmentId', 'appointmentNumber scheduledDate appointmentType clinic.clinicName')
                .lean(),
            MedicalRecord.countDocuments(query)
        ]);

        return {
            data: records,
            pagination: getPagination(total, page, limit)
        };
    }

}

module.exports = new MedicalRecordService();