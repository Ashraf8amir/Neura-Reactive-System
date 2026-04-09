const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const getPatientTwinSchema = Joi.object({
    params: Joi.object({
        patientId: Joi.string().pattern(objectIdPattern).required().messages({
            'any.required': 'Patient ID is required',
            'string.pattern.base': 'Patient ID must be a valid 24-character hex string'
        })
    })
});

const simulateWhatIfSchema = Joi.object({
    body: Joi.object({
        scenario: Joi.string().trim().min(10).max(500).required().messages({
            'any.required': 'Scenario is required',
            'string.empty': 'Scenario is required',
            'string.min': 'Scenario must be at least 10 characters',
            'string.max': 'Scenario cannot exceed 500 characters'
        })
    })
});

module.exports = {
    getPatientTwinSchema,
    simulateWhatIfSchema
};
