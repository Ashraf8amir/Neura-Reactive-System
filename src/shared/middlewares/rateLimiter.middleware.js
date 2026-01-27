const rateLimit = require('express-rate-limit');

const rateLimiter = {
    globalLimiter : rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 200,
        message: {
            status: 'fail',
            message: 'Too many requests from this IP, please try again after 15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    refreshTokenLimiter : rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 10,
        message: {
            status: 'fail',
            message: 'Too many refresh token requests from this IP, please try again after 15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    passwordResetLimiter : rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 3,
        message: {
            status: 'fail',
            message: 'Too many password reset requests from this IP, please try again after 15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    passwordChangeLimiter : rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 5, 
        message: {
            status: 'fail',
            message: 'Too many password change attempts, please try again after 15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    loginLimiter : rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 5,
        message: {
            status: 'fail',
            message: 'Too many login attempts from this IP, please try again after 15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
    })
}

module.exports = rateLimiter;