const Joi = require('joi');
const { URGENCY_LEVEL } = require('./medicalRecord.constant');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const medicationSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Medication name is required',
        'string.empty': 'Medication name cannot be empty'
    }),
    dose: Joi.string().required().messages({
        'any.required': 'Medication dose is required',
        'string.empty': 'Medication dose cannot be empty'
    }),
    frequency: Joi.string().required().messages({
        'any.required': 'Medication frequency is required',
        'string.empty': 'Medication frequency cannot be empty'
    }),
    duration: Joi.string().required().messages({
        'any.required': 'Medication duration is required',
        'string.empty': 'Medication duration cannot be empty'
    }),
    notes: Joi.string().allow('').optional()
});

const prescriptionSchema = Joi.object({
    medications: Joi.array().items(medicationSchema).optional(),
    lifestyle_advice: Joi.string().allow('').optional()
});

const alertsSchema = Joi.object({
    drug_interactions: Joi.array().items(Joi.string()).optional(),
    allergy_conflicts: Joi.array().items(Joi.string()).optional(),
    requires_immediate_attention: Joi.boolean().optional()
});

const aiSummarySchema = Joi.object({
    symptoms: Joi.array().items(Joi.string()).min(1).required().messages({
        'any.required': 'Symptoms are required',
        'array.min': 'At least one symptom is required'
    }),
    diagnosis: Joi.string().required().messages({
        'any.required': 'Diagnosis is required',
        'string.empty': 'Diagnosis cannot be empty'
    }),
    prescription: prescriptionSchema.optional(),
    summary: Joi.string().required().messages({
        'any.required': 'Summary is required',
        'string.empty': 'Summary cannot be empty'
    }),
    follow_up: Joi.string().allow('').optional(),
    urgency_level: Joi.string()
        .valid(...Object.values(URGENCY_LEVEL))
        .required()
        .messages({
            'any.required': 'Urgency level is required',
            'any.only': 'Urgency level must be one of: routine, urgent, emergency'
        }),
    alerts: alertsSchema.optional()
});

const createMedicalRecordSchema = Joi.object({
    body: Joi.object({
        appointmentId: Joi.string().pattern(objectIdPattern).required().messages({
            'any.required': 'Appointment ID is required',
            'string.pattern.base': 'Appointment ID must be a valid 24-character hex string'
        }),
        aiSummary: aiSummarySchema.required().messages({
            'any.required': 'AI summary is required'
        }),
        doctorNotes: Joi.string().allow('').optional(),
        isVisibleToPatient: Joi.boolean().optional()
    })
});

const getMyRecordsSchema = Joi.object({
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1).messages({
            'number.min': 'Page must be at least 1'
        }),
        limit: Joi.number().integer().min(1).max(50).default(10).messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 50'
        })
    })
});

const getRecordByIdSchema = Joi.object({
    params: Joi.object({
        recordId: Joi.string().pattern(objectIdPattern).required().messages({
            'any.required': 'Record ID is required',
            'string.pattern.base': 'Record ID must be a valid 24-character hex string'
        })
    })
});

const getPatientHistorySchema = Joi.object({
    params: Joi.object({
        patientId: Joi.string().pattern(objectIdPattern).required().messages({
            'any.required': 'Patient ID is required',
            'string.pattern.base': 'Patient ID must be a valid 24-character hex string'
        })
    }),
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1).messages({
            'number.min': 'Page must be at least 1'
        }),
        limit: Joi.number().integer().min(1).max(50).default(10).messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 50'
        })
    })
});

module.exports = {
    createMedicalRecordSchema,
    getMyRecordsSchema,
    getRecordByIdSchema,
    getPatientHistorySchema
};