const mongoose = require('mongoose');
const { URGENCY_LEVEL } = require('./medicalRecord.constant');
const logger = require('../../core/logger');
const digitalTwinService = require('../digital-twin/digital-twin.service');

const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dose: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    notes: { type: String }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
    medications: [medicationSchema],
    lifestyle_advice: { type: String }
}, { _id: false });

const alertsSchema = new mongoose.Schema({
    drug_interactions: [{ type: String }],
    allergy_conflicts: [{ type: String }],
    requires_immediate_attention: { type: Boolean, default: false }
}, { _id: false });

const aiSummarySchema = new mongoose.Schema({
    symptoms: [{ type: String, required: true }],
    diagnosis: { type: String, required: true },
    prescription: prescriptionSchema,
    summary: { type: String, required: true },
    follow_up: { type: String },
    urgency_level: {
        type: String,
        enum: Object.values(URGENCY_LEVEL),
        required: true
    },
    alerts: alertsSchema
}, { _id: false });

const medicalRecordSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        index: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    visitDate: {
        type: Date,
        default: Date.now
    },
    aiSummary: {
        type: aiSummarySchema,
        required: true
    },
    doctorNotes: {
        type: String,
        default: ''
    },
    isVisibleToPatient: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

medicalRecordSchema.index({ patientId: 1, visitDate: -1 });
medicalRecordSchema.index({ patientId: 1, isVisibleToPatient: 1, visitDate: -1 });

medicalRecordSchema.post('save', async function(doc, next) {
    try {
        await digitalTwinService.updateDigitalTwinFromMedicalRecord(doc);
        next();
    } catch (error) {
        logger.error('Failed to update digital twin after medical record save', {
            medicalRecordId: doc?._id?.toString(),
            patientId: doc?.patientId?.toString(),
            error: error.message
        });
        next(error);
    }
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;
