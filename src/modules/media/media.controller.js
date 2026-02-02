const mediaService = require('./media.service');
const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const ApiResponse = require('../../core/apiResponse');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');

exports.uploadProfileImageController = (model, folderPath) =>
    asyncWrapper(async (req, res) => {
        const { profileImage, imageDetails } = await mediaService.uploadProfileImage(
            model,
            req.user.id,
            req.file,
            folderPath
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

exports.deleteProfileImageController = (model) =>
    asyncWrapper(async (req, res) => {
        await mediaService.deleteProfileImage(model, req.user.id);

        return new ApiResponse(
            res,
            200,
            HTTP_STATUS_TEXT.SUCCESS,
            'Profile image deleted successfully'
        );
    });