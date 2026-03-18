const joi = require('joi');
const passwordComplexity = require('joi-password-complexity');
const enums = require('../../shared/constants/enums');

exports.registerSchema = joi.object({
    body: joi.object({
        firstName: joi.string().trim().min(2).max(30).required()
            .pattern(/^[\u0600-\u06FFa-zA-Z\s]+$/)
            .messages({
                'string.pattern.base': 'First name must contain only Arabic or English letters',
                'any.required': 'First name is required'
            }),
        lastName: joi.string().trim().min(2).max(30).required()
            .pattern(/^[\u0600-\u06FFa-zA-Z\s]+$/)
            .messages({
                'string.pattern.base': 'Last name must contain only Arabic or English letters',
                'any.required': 'Last name is required'
            }),
        email: joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),
        password: passwordComplexity().required().messages({
            'any.required': 'Password is required'
        }),
        role: joi.string().valid(...Object.values(enums.ROLE)).messages({
            'any.only': 'Role must be either doctor, patient, nurse, or pharmacy',
            'any.required': 'Role is required'
        }),
        dateOfBirth: joi.date().max('now')
            .when('role', { is: enums.ROLE.PHARMACY, then: joi.optional(), otherwise: joi.required() })
            .messages({
                'date.max': 'Date of birth cannot be in the future',
                'any.required': 'Date of birth is required'
            }),
        gender: joi.string().valid('male', 'female')
            .when('role', { is: enums.ROLE.PHARMACY, then: joi.optional(), otherwise: joi.required() })
            .messages({
                'any.only': 'Gender must be either male or female',
                'any.required': 'Gender is required'
            })
    })
});

exports.loginSchema = joi.object({
    body: joi.object({
        email: joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),
        password: joi.string().required().messages({
            'any.required': 'Password is required'
        })
    })
});

exports.completeGoogleRegistrationSchema = joi.object({
    body: joi.object({
        role: joi.string().valid(...Object.values(enums.ROLE)).required().messages({
            'any.only': 'Role must be either doctor, patient, nurse, or pharmacy',
            'any.required': 'Role is required'
        }),
        gender: joi.string().valid('male', 'female')
            .when('role', { is: enums.ROLE.PHARMACY, then: joi.optional(), otherwise: joi.required() })
            .messages({
                'any.only': 'Gender must be either male or female',
                'any.required': 'Gender is required'
            }),
        dateOfBirth: joi.date().max('now')
            .when('role', { is: enums.ROLE.PHARMACY, then: joi.optional(), otherwise: joi.required() })
            .messages({ 
                'date.max': 'Date of birth cannot be in the future',
                'any.required': 'Date of birth is required'
            }),
        tempToken: joi.string().required().messages({
            'any.required': 'Temporary token is required'
        })
    })
});

exports.forgotPasswordSchema = joi.object({
    body: joi.object({
        email: joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        })
    })
});

exports.resetPasswordSchema = joi.object({
    body: joi.object({
        newPassword: passwordComplexity().required().messages({
            'any.required': 'New password is required'
        }),
        confirmPassword: joi.string().required().valid(joi.ref('newPassword')).messages({
            'any.only': 'Confirm password must match new password',
            'string.empty': 'Confirm password is required',
            'any.required': 'Confirm password is required'
        })
    })
});

exports.changePasswordSchema = joi.object({
    body: joi.object({
        currentPassword: joi.string().required().messages({
            'any.required': 'Current password is required'
        }),
        newPassword: passwordComplexity().required().messages({
            'any.required': 'New password is required'
        }),
        confirmPassword: joi.string().required().valid(joi.ref('newPassword')).messages({
            'any.only': 'Confirm password must match new password',
            'string.empty': 'Confirm password is required',
            'any.required': 'Confirm password is required'
        })
    })
});

exports.verifyEmailSchema = joi.object({
    body: joi.object({
        otp: joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
            'string.length': 'OTP must be exactly 6 digits',
            'string.pattern.base': 'OTP must contain only numbers',
            'any.required': 'OTP is required'
        })
    })
});
