const cloudinaryService = require('../../config/cloudinary');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');

class MediaService {
    async uploadProfileImage(model, userId, fileData, folderPath) {
        const user = await model.findById(userId);
        if (!user) {
            throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'User not found');
        }

        if (user.profileImage?.imageUrl) {
            const publicId = cloudinaryService.extractPublicId(user.profileImage.imageUrl);
            if (publicId) {
                await cloudinaryService.deleteFromCloudinary(publicId, 'image');
            }
        }

        const result = await cloudinaryService.uploadDocumentToCloudinary(
            fileData.buffer,
            fileData.originalname,
            fileData.mimetype,
            {
                folder: folderPath,
                publicId: `profile-${userId}-${Date.now()}`,
                transformation: [
                    { width: 500, height: 500, crop: 'fill', gravity: 'face' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            }
        );

        user.profileImage = { imageUrl: result.url };
        await user.save();

        return {
            profileImage: user.profileImage,
            imageDetails: {
                cloudinaryId: result.publicId,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.size
            }
        }
    };
    async deleteProfileImage(model, userId) {
        const user = await model.findById(userId);
        if (!user) {
            throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'User not found');
        }

        if (!user.profileImage?.imageUrl) {
            throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'No profile image found');
        }

        const publicId = cloudinaryService.extractPublicId(user.profileImage.imageUrl);
        if (publicId) {
            await cloudinaryService.deleteFromCloudinary(publicId, 'image');
        }

        user.profileImage = undefined;
        await user.save();

        return { message: 'Profile image deleted successfully' };
    };

}

module.exports = new MediaService();