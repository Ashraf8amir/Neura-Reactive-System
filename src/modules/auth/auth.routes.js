const express = require('express');
const authController = require('./auth.controller.js');
const rateLimiters = require('../../shared/middlewares/rateLimiter.middleware.js');
const verifyToken = require('../../shared/middlewares/verifyToken.middleware.js');
const validateReq = require('../../shared/middlewares/validation.middleware.js'); 
const authValidators = require('./auth.validator.js');

const router = express.Router();

// ===== Authentication Routes =====
router.post("/register",
    validateReq(authValidators.registerSchema),
    authController.register
);
router.post("/login",
    rateLimiters.loginLimiter,
    validateReq(authValidators.loginSchema), 
    authController.login
);
router.post("/logout", 
    verifyToken, 
    authController.logout
);
router.post("/refresh-token",
  rateLimiters.refreshTokenLimiter,
  authController.refreshToken
);

// ===== Google OAuth Routes =====
router.get('/google-auth-url', 
    authController.googleAuthUrl
);
router.get('/google-callback', 
    authController.googleCallback
);
router.post('/complete-google-registration', 
    validateReq(authValidators.completeGoogleRegistrationSchema),
    authController.completeGoogleRegistration
);

// ===== Email Verification Routes =====
router.post('/send-verify-otp', 
    verifyToken, 
    authController.sendVerifyOtp
);
router.post("/verify-email", 
    validateReq(authValidators.verifyEmailSchema),
    verifyToken, 
    authController.verifyEmail
);

// ===== Password Reset Routes =====
router.post('/request-password-reset', 
    rateLimiters.passwordResetLimiter,
    validateReq(authValidators.forgotPasswordSchema),
    authController.requestPasswordReset
);
router.post('/reset-password', 
    validateReq(authValidators.resetPasswordSchema),
    authController.resetPassword
);
router.post('/change-password', 
    validateReq(authValidators.changePasswordSchema),
    verifyToken, authController.changePassword
);

module.exports = router;