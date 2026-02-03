const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware.js');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums.js');
const ApiResponse = require('../../core/apiResponse.js');
const service = require('./auth.service.js');
const cookieConfig = require('./auth.helper.js').getCookieConfig();

// ============ Auth Controllers ============

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = asyncWrapper(async (req, res) => {
    const { user, accessToken, refreshToken } =
        await service.registerService(req.body, req);

    res.cookie('refreshToken', refreshToken, cookieConfig.refresh);

    return new ApiResponse(
        res,
        201, 
        HTTP_STATUS_TEXT.SUCCESS,
        `${user.role} account created successfully. Please complete your profile.`,
        { user, accessToken }
    );
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncWrapper(async (req, res) => {
    const { user, accessToken, refreshToken } =
        await service.loginService(req.body, req);

    res.cookie('refreshToken', refreshToken, cookieConfig.refresh);

    return new ApiResponse(
      res,
      200,
      HTTP_STATUS_TEXT.SUCCESS,
      `Welcome back, ${user.fullName}!`,
      {
        accessToken,
        accountStatus: {
          isActive: user.isActive,
        },
      }
    );
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
exports.logout = asyncWrapper(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    await service.logoutService(refreshToken);

    res.clearCookie('refreshToken', { ...cookieConfig.refresh, maxAge: 0 });

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Logged out successfully'
    );
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = asyncWrapper(async (req, res) => {
    const oldRefreshToken = req.cookies.refreshToken;

    const { accessToken, refreshToken } = 
        await service.refreshTokenService(oldRefreshToken, req);

    res.cookie('refreshToken', refreshToken, cookieConfig.refresh);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Token refreshed successfully',
        { accessToken }
    );
});

// =========== Google OAuth2 Controllers ============

/**
 * @desc    Generate Google OAuth2 authentication URL
 * @route   GET /api/v1/auth/google-auth-url
 * @access  Public
 */
exports.googleAuthUrl = asyncWrapper(async (req, res) => {
    const { authUrl, stateString, codeVerifier } = 
        await service.googleAuthUrlService();

    res.cookie('state', stateString, cookieConfig.state);
    res.cookie('code_verifier', codeVerifier, cookieConfig.code_verifier);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Google authentication URL generated successfully',
        { url: authUrl }
    );
});

/**
 * @desc    Handle Google OAuth2 callback
 * @route   GET /api/v1/auth/google-callback
 * @access  Public
 */
exports.googleCallback = asyncWrapper(async (req, res) => {
    const { code, state: receivedState } = req.query;
    const stateCookie = req.cookies.state;
    const codeVerifier = req.cookies.code_verifier || req.query.code_verifier || req.body?.code_verifier;

    const { user, accessToken, refreshToken, userInfo, isNewUser, tempToken } = 
          await service.googleCallbackService(code, stateCookie, receivedState, codeVerifier, req);
    

    if (isNewUser) {
        res.clearCookie('state', { ...cookieConfig.state, maxAge: 0 });
        res.clearCookie('code_verifier', { ...cookieConfig.code_verifier, maxAge: 0 });

        return new ApiResponse(
            res,
            200,
            HTTP_STATUS_TEXT.SUCCESS,
            'Google authentication successful. Please complete your registration.',
            { isNewUser, tempToken, userInfo }
        );
    }

    res.cookie('refreshToken', refreshToken, cookieConfig.refresh);
    res.clearCookie('state', { ...cookieConfig.state, maxAge: 0 });
    res.clearCookie('code_verifier', { ...cookieConfig.code_verifier, maxAge: 0 });

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Welcome back!',
        { isNewUser, accessToken, user, userInfo }
    );
});

/**
 * @desc    Complete Google registration for new users
 * @route   POST /api/v1/auth/complete-google-registration
 * @access  Public
 */
exports.completeGoogleRegistration = asyncWrapper(async (req, res) => {
    const userData = req.body;

    const { user, accessToken, refreshToken } =
        await service.completeGoogleRegistrationService(userData, req);

    res.cookie('refreshToken', refreshToken, cookieConfig.refresh);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Google registration completed successfully',
        { accessToken, user }
    );
});

// =========== Email Verification Controllers ============

/** 
 * @desc    Send verification OTP to user's email
 * @route   POST /api/v1/auth/send-verify-otp
 * @access  Private
 */
exports.sendVerifyOtp = asyncWrapper(async (req, res) => {
    const { email } = req.user;
    await service.sendVerifyOtpService(email);
    
    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Verification OTP sent successfully',
        {},
        {
            expiresIn: '10 minutes',
            canResendAfter: '1 minute'
        }
    );
});

/**
 * @desc    Verify email using OTP
 * @route   POST /api/v1/auth/verify-email
 * @access  Private
 */
exports.verifyEmail = asyncWrapper(async (req, res) => {
    const { otp } = req.body;
    const { email } = req.user;

    await service.verifyEmailService(email, otp);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Email verified successfully'
    );
});

// =========== Password Management Controllers ============

/**
 * @desc    Request password reset
 * @route   POST /api/v1/auth/request-password-reset
 * @access  Public
 */
exports.requestPasswordReset = asyncWrapper(async (req, res) => {
    const { email } = req.body;

    await service.requestPasswordResetService(email);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Password reset instructions have been sent to your email',
        {
            expiresIn: '15 minutes',
            canResendAfter: '1 minute'
        }
    );
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
exports.resetPassword = asyncWrapper(async (req, res) => {
    const { token } = req.query;
    const { newPassword } = req.body;

    await service.resetPasswordService(token, newPassword);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Password has been reset successfully'
    );
});

/**
 * @desc    Change password
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
exports.changePassword = asyncWrapper(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { email } = req.user;
    const currentRefreshToken = req.cookies.refreshToken;

    await service.changePasswordService(email, currentPassword, newPassword, currentRefreshToken);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Password changed successfully'
    );
});