const joi = require("joi");

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
        phone: joi.string().pattern(/^01[0-2,5]{1}[0-9]{8}$/).allow('', null).optional()
            .messages({ 'string.pattern.base': 'Phone number must be between 10 to 15 digits' }),
        nationality: joi.string().trim().min(2).max(50).valid('Egyptian', 'other').allow('', null).optional(),
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
}
exports.updateProfessionalInfoSchema = (data) => {
    const updateProfessionalInfoSchema = joi.object({
        primarySpecialization: joi.string().trim().min(2).max(100).optional(),
        subSpecializations: joi.array().items(
            joi.string().trim().min(2).max(100)
        ).optional(),
        highestDegree: joi.string().trim().min(2).max(100).optional(),
        medicalSchool: joi.string().trim().min(2).max(100).optional(),
        yearsOfExperience: joi.number().integer().min(0).max(100).optional(),
        currentPosition: joi.string().trim().min(2).max(100).optional(),
        hospitalAffiliation: joi.array().items(
            joi.string().trim().min(2).max(100)
        ).optional(),
        bio: joi.string().trim().max(1000).optional()
    }).min(1).messages({'object.min': 'At least one field must be provided for update'})

    return updateProfessionalInfoSchema.validate(data, { abortEarly: false });
}
exports.addCertificateSchema = (data) => {
    const addCertificateSchema = joi.object({
        name: joi.string().trim().min(2).max(200).required(),
        institution: joi.string().trim().min(2).max(200).required(),
        Year: joi.number().integer().min(1900).max(new Date().getFullYear()).required()
    });

    return addCertificateSchema.validate(data, { abortEarly: false });
}
exports.addMembershipSchema = (data) => {
    const addMembershipSchema = joi.object({
        nameOfAssociation: joi.string().trim().min(2).max(200).required(),
        memberId: joi.string().trim().min(1).max(100).allow('', null).optional(),
        Since: joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null).optional()
    }); 

    return addMembershipSchema.validate(data, { abortEarly: false });
}
exports.addAwardSchema = (data) => {
    const addAwardSchema = joi.object({
        name: joi.string().trim().min(2).max(200).required(),
        awardedBy: joi.string().trim().min(2).max(200).required(),
        year: joi.number().integer().min(1900).max(new Date().getFullYear()).required()
    });

    return addAwardSchema.validate(data, { abortEarly: false });
}