const joi = require('joi');
const { patientConstants } = require('./patient.constant');
const commonConstants = require('../../shared/constants/enums');

exports.updateBasicInfoSchema = (data) => {
    const updateBasicInfoSchema = joi.object({
        firstName: joi.string().trim().min(2).max(30)
            .pattern(/^[\u0600-\u06FFa-zA-Z\s]+$/)
            .optional()
            .messages({
                'string.pattern.base': 'First name must contain only Arabic or English letters'
            }),
        lastName: joi.string().trim().min(2).max(30)
            .pattern(/^[\u0600-\u06FFa-zA-Z\s]+$/)
            .optional()
            .messages({
                'string.pattern.base': 'Last name must contain only Arabic or English letters'
            }),
        dateOfBirth: joi.date().max('now').optional().messages({
            'date.max': 'Date of birth cannot be in the future'
        }),
        gender: joi.string().valid('male', 'female').optional().messages({
            'any.only': 'Gender must be either male or female'
        }),
        height: joi.number().positive().allow('', null).optional()
            .messages({'number.positive': 'Height must be a positive number'}),
        weight: joi.number().positive().allow('', null).optional()
            .messages({'number.positive': 'Weight must be a positive number' }),
        bloodType:  joi.string().valid(...patientConstants.BLOOD_TYPES).allow('', null).optional()
            .messages({ 'any.only': `Blood type must be one of the following: ${patientConstants.BLOOD_TYPES.join(', ')}` }),
        nationalId: joi.string().pattern(/^[0-9]{14}$/).allow('', null).optional()
            .messages({ 'string.pattern.base': 'National ID must be exactly 14 digits' }),
        maritalStatus: joi.string().valid(...commonConstants.MARITAL_STATUS).allow('', null).optional()
            .messages({ 'any.only': `Marital status must be one of the following: ${commonConstants.MARITAL_STATUS.join(', ')}` }),
        nationality: joi.string().trim().min(2).max(50).valid('Egyptian', 'other').allow('', null).optional(),
        phone: joi.string().pattern(/^01[0-2,5]{1}[0-9]{8}$/).allow('', null).optional()
        .messages({ 'string.pattern.base': 'Phone number must be between 10 to 15 digits' }),
        address: joi.object({
                governorate: joi.string().trim().allow('', null).optional()
                    .messages({ 'string.empty': 'Governorate cannot be empty' }),
                city: joi.string().trim().allow('', null).optional()
                    .messages({ 'string.empty': 'City cannot be empty' }),
                street: joi.string().trim().allow('', null).optional()
                    .messages({ 'string.empty': 'Street cannot be empty' }),
            }).optional()
    }).min(1).messages({'object.min': 'At least one field must be provided for update'})

    return updateBasicInfoSchema.validate(data, { abortEarly: false });
};

exports.updateMedicalProfileSchema = (data) => {
    const updateMedicalProfileSchema = joi.object({
        lifestyle: joi.object({
            smokingStatus: joi.string().valid(...patientConstants.SMOKING_STATUS).allow('', null).optional().messages({
                'any.only': 'Smoking status must be one of: non-smoker, ex-smoker, current-smoker'
            }),
            alcoholConsumption: joi.string().valid(...patientConstants.ALCOHOL_CONSUMPTION).allow('', null).optional().messages({
                'any.only': 'Alcohol consumption must be one of: never, occasionally, regularly'
            }),
            physicalActivity: joi.string().valid(...patientConstants.PHYSICAL_ACTIVITY).allow('', null).optional().messages({
                'any.only': 'Physical activity level must be one of: sedentary, light, moderate, active, very active'
            }),
            dietType: joi.string().trim().min(3).max(50).allow('', null).optional(),
            sleepQuality: joi.string().valid(...patientConstants.SLEEP_QUALITY).allow('', null).optional().messages({
                'any.only': 'Sleep quality must be one of: excellent, good, fair, poor'
            }),
            averageSleepHours: joi.number().min(0).max(24).allow('', null).optional().messages({
                'number.min': 'Average sleep hours cannot be negative',
                'number.max': 'Average sleep hours cannot exceed 24 hours'
            }),
        }).optional(),
    })

    return updateMedicalProfileSchema.validate(data, { abortEarly: false });
};
exports.addChronicDiseaseSchema = (data) => {
    const addChronicDiseaseSchema = joi.object({
        nameOfDisease: joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'Name of disease is required'
        }),
        type: joi.string().trim().min(2).max(50).required().messages({
            'string.empty': 'Type is required'
        }),
        since: joi.date().max('now').required().messages({
            'date.max': 'Since date cannot be in the future'
        })
    });
    return addChronicDiseaseSchema.validate(data, { abortEarly: false });
};
exports.updateChronicDiseaseSchema = (data) => {
    const updateChronicDiseaseSchema = joi.object({
        nameOfDisease: joi.string().trim().min(2).max(100).optional().messages({
            'string.empty': 'Name of disease cannot be empty'
        }),
        type: joi.string().trim().min(2).max(50).optional().messages({
            'string.empty': 'Type cannot be empty'
        }),
        since: joi.date().max('now').optional().messages({
            'date.max': 'Since date cannot be in the future'
        })
    }).min(1).messages({'object.min': 'At least one field must be provided for update'});
    return updateChronicDiseaseSchema.validate(data, { abortEarly: false });
};

exports.addAllergySchema = (data) => {
    const addAllergySchema = joi.object({
        nameOfAllergy: joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'Name of allergy is required',
            'any.required': 'Name of allergy is required'
        }),
        types: joi.array().items(
            joi.object({
                reaction: joi.string().trim().min(2).max(200).required().messages({
                    'string.empty': 'Reaction is required',
                    'any.required': 'Reaction is required'
                }),
                severity: joi.string().valid(...patientConstants.ALLERGY_SEVERITY).required().messages({
                    'any.only': `Severity must be one of the following: ${patientConstants.ALLERGY_SEVERITY.join(', ')}`,
                    'any.required': 'Severity is required'
                })
            })
        ).min(1).required().messages({
            'array.min': 'At least one allergy type must be provided',
            'any.required': 'Allergy types are required'
        })
    });
    return addAllergySchema.validate(data, { abortEarly: false });
};
exports.updateAllergySchema = (data) => {
    const updateAllergySchema = joi.object({
        nameOfAllergy: joi.string().trim().min(2).max(100).optional().messages({
            'string.empty': 'Name of allergy cannot be empty'
        }),
        types: joi.array().items(
            joi.object({
                reaction: joi.string().trim().min(2).max(200).optional().messages({
                    'string.empty': 'Reaction is required',
                    'any.required': 'Reaction is required'
                }),
                severity: joi.string().valid(...patientConstants.ALLERGY_SEVERITY).optional().messages({
                    'any.only': `Severity must be one of the following: ${patientConstants.ALLERGY_SEVERITY.join(', ')}`,
                    'any.required': 'Severity is required'
                })
            })
        ).optional()
    }).min(1).messages({'object.min': 'At least one field must be provided for update'});
    return updateAllergySchema.validate(data, { abortEarly: false });
};

exports.addSurgerySchema = (data) => {
    const addSurgerySchema = joi.object({
        nameOfSurgery: joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'Name of surgery is required'
        }),
        date: joi.date().max('now').required().messages({
            'date.max': 'Surgery date cannot be in the future'
        }),
        hospital: joi.string().trim().min(2).max(100).optional(),
        doctor: joi.string().trim().min(2).max(100).optional(),
        notes: joi.string().trim().max(500).optional()
    });

    return addSurgerySchema.validate(data, { abortEarly: false });
};
exports.updateSurgerySchema = (data) => {
    const updateSurgerySchema = joi.object({
        nameOfSurgery: joi.string().trim().min(2).max(100).optional().messages({
            'string.empty': 'Name of surgery cannot be empty'
        }),
        date: joi.date().max('now').optional().messages({
            'date.max': 'Surgery date cannot be in the future'
        }),
        hospital: joi.string().trim().min(2).max(100).optional(),
        doctor: joi.string().trim().min(2).max(100).optional(),
        notes: joi.string().trim().max(500).optional()
    }).min(1).messages({'object.min': 'At least one field must be provided for update'});

    return updateSurgerySchema.validate(data, { abortEarly: false });
};

exports.addFamilyMedicalHistorySchema = (data) => {
    const addFamilyMedicalHistorySchema = joi.object({
        nameOfFamilyMember: joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'Name of family member is required'
        }),
        nameOfDisease: joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'Name of disease is required'
        }),
        age: joi.number().integer().min(0).optional().messages({
            'number.min': 'Age cannot be negative'
        })
    });
    return addFamilyMedicalHistorySchema.validate(data, { abortEarly: false });
};
exports.updateFamilyMedicalHistorySchema = (data) => {
    const updateFamilyMedicalHistorySchema = joi.object({
        nameOfFamilyMember: joi.string().trim().min(2).max(100).optional().messages({
            'string.empty': 'Name of family member cannot be empty'
        }),
        nameOfDisease: joi.string().trim().min(2).max(100).optional().messages({
            'string.empty': 'Name of disease cannot be empty'
        }),
        age: joi.number().integer().min(0).optional().messages({
            'number.min': 'Age cannot be negative'
        })
    }).min(1).messages({'object.min': 'At least one field must be provided for update'});
    return updateFamilyMedicalHistorySchema.validate(data, { abortEarly: false });
};

exports.addMedicationSchema = (data) => {
    const addMedicationSchema = joi.object({
        name: joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'Name of medication is required',
            'any.required': 'Name of medication is required'
        }),
        reason: joi.string().trim().min(2).max(200).required().messages({
            'string.empty': 'Reason is required',
            'any.required': 'Reason is required'
        }),
        dosage: joi.string().trim().min(1).max(50).required().messages({
            'string.empty': 'Dosage is required',
            'any.required': 'Dosage is required'
        })
    });
    return addMedicationSchema.validate(data, { abortEarly: false });
};
exports.updateMedicationSchema = (data) => {
    const updateMedicationSchema = joi.object({
        name: joi.string().trim().min(2).max(100).optional().messages({
            'string.empty': 'Name of medication cannot be empty'
        }),
        reason: joi.string().trim().min(2).max(200).optional().messages({
            'string.empty': 'Reason cannot be empty'
        }),
        dosage: joi.string().trim().min(1).max(50).optional().messages({
            'string.empty': 'Dosage cannot be empty'
        })
    }).min(1).messages({'object.min': 'At least one field must be provided for update'});
    return updateMedicationSchema.validate(data, { abortEarly: false });
};


exports.addEmergencyContactSchema = (data) => {
    const addEmergencyContactSchema = joi.object({
        name: joi.string().trim().min(2).max(50).required(),
        relationship: joi.string().trim().min(2).max(30).required(),
        phoneNumber: joi.string().pattern(/^01[0-2,5]{1}[0-9]{8}$/).required().messages({
            'string.pattern.base': 'Phone number must be a valid Egyptian phone number'
        }),
        alternatePhone: joi.string().pattern(/^01[0-2,5]{1}[0-9]{8}$/).optional().allow(null, '').messages({
            'string.pattern.base': 'Alternate phone number must be a valid Egyptian phone number'
        }),
        email: joi.string().trim().email().optional().allow(null, '').messages({
            'string.email': 'Email must be a valid email address'
        })
    });
    return addEmergencyContactSchema.validate(data, { abortEarly: false });
};
exports.updateEmergencyContactSchema = (data) => {  
    const updateEmergencyContactSchema = joi.object({
        name: joi.string().trim().min(2).max(50).optional(),
        relationship: joi.string().trim().min(2).max(30).optional(),
        phoneNumber: joi.string().pattern(/^01[0-2,5]{1}[0-9]{8}$/).optional().messages({
            'string.pattern.base': 'Phone number must be a valid Egyptian phone number'
        }),
        alternatePhone: joi.string().pattern(/^01[0-2,5]{1}[0-9]{8}$/).optional().allow(null, '').messages({
            'string.pattern.base': 'Alternate phone number must be a valid Egyptian phone number'
        }),
        email: joi.string().trim().email().optional().allow(null, '').messages({
            'string.email': 'Email must be a valid email address'
        })
    }).min(1).messages({'object.min': 'At least one field must be provided for update'});
    return updateEmergencyContactSchema.validate(data, { abortEarly: false });
};