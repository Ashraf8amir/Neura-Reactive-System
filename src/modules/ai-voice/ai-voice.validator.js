const joi = require('joi');

exports.transcribeSchema = joi.object({
    body: joi.object({
        patientId: joi.string().length(24).hex().required().messages({
            'string.length': 'Patient ID must be a valid 24-character ObjectId',
            'string.hex': 'Patient ID must be a valid hexadecimal ObjectId',
            'any.required': 'Patient ID is required'
        }),
        appointmentId: joi.string().length(24).hex().optional().messages({
            'string.length': 'Appointment ID must be a valid 24-character ObjectId',
            'string.hex': 'Appointment ID must be a valid hexadecimal ObjectId'
        })
    })
});
