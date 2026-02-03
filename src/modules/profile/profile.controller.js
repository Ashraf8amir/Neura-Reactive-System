const profileService = require('./profile.service');
const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const ApiResponse = require('../../core/apiResponse');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const cookieConfig = require('../../modules/auth/auth.helper').getCookieConfig();


/**    
    * @desc    Get logged-in user's profile
    * @route   GET /api/v1/profile/me
    * @access  Private
*/
exports.getMe = asyncWrapper(async (req, res) => {
    const user = await profileService.getMeService(req.user.id);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'User profile retrieved successfully',
        { user }
    );
});
/** 
    * @desc    Soft delete logged-in user's account
    * @route   DELETE /api/v1/profile/soft-delete-me
    * @access  Private
*/
exports.softDeleteMe = asyncWrapper(async (req, res) => {
    await profileService.softDeleteMeService(req.user.id);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'User account deleted successfully'
    );
});
/** 
    * @desc    Upload profile image for logged-in user
    * @route   POST /api/v1/profile/image
    * @access  Private
*/
exports.uploadProfileImageController = asyncWrapper(async (req, res) => {
    const { model, folder } = req.resConfig;
    const { profileImage, imageDetails } = await profileService.uploadProfileImageService(
        model,
        req.user.id,
        req.file,
        folder
    );

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Profile image uploaded successfully',
        { profileImage },
        { imageDetails }
    );
});
/** 
    * @desc    Delete profile image for logged-in user
    * @route   DELETE /api/v1/profile/image
    * @access  Private
*/
exports.deleteProfileImageController = asyncWrapper(async (req, res) => {
    const { model } = req.resConfig;
    await profileService.deleteProfileImageService(model, req.user.id);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Profile image deleted successfully'
    );
});
/**
 * @desc    Get active sessions for logged-in user
 * @route   GET /api/v1/profile/me/sessions
 * @access  Private
 */
exports.getActiveSessions = asyncWrapper(async (req, res) => {
    const { activeSessions, count } = await profileService.getActiveSessionsService(req.user.id, req.cookies.refreshToken);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Active sessions retrieved successfully',
        { activeSessions },
        { count }
    );
});
/**
 * @desc    Terminate a specific session for logged-in user
 * @route   DELETE /api/v1/profile/me/sessions/:sessionId
 * @access  Private
 */
exports.terminateSession = asyncWrapper(async (req, res) => {
    await profileService.terminateSessionService(req.user.id, req.params.sessionId);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Session terminated successfully'
    );
});