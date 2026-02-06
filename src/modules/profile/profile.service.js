const cloudinaryService = require('../../config/cloudinary');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const User = require('../../shared/models/user.model');

class ProfileService {
    async getMeService(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'User not found');
        }

        return user;
    };
    async softDeleteMeService(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'User not found');
        }

        await User.findByIdAndUpdate(
            userId,
            { 
                isDeleted: true, 
                deletedAt: new Date(),
                refreshTokens: [],
                email: `deleted-${Date.now()}-${user.email}`
            }
        );

        return { message: 'User account deleted successfully' };
    };

    async uploadProfileImageService(model, userId, fileData, folderPath) {
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
    async deleteProfileImageService(model, userId) {
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

    async getActiveSessionsService(userId, currentRefreshToken) {
        const user = await User.findById(userId, { refreshTokens: 1 });

        if (!user) {
            throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'User not found');
        }

        const activeSessions = user.refreshTokens
            .filter(session => session.expiresAt > new Date()) 
            .sort((a, b) => b.lastUsed - a.lastUsed)
            .map(session => ({
                sessionId: session._id,
                device: {
                    type: session.deviceType,
                    vendor: session.deviceVendor,
                    model: session.deviceModel,
                    browser: session.browser,
                    os: session.os,
                },
                isPrimary: session.isPrimary,
                ipAddress: session.ipAddress,
                createdAt: session.createdAt,
                lastUsed: session.lastUsed,
                expiresAt: session.expiresAt,
                isCurrentDevice: session.token === currentRefreshToken
            }));

        return { activeSessions, count: activeSessions.length };
    }
    async terminateSessionService(userId, sessionId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'User not found');
        }

        const sessionExists = user.refreshTokens.id(sessionId);
        if (!sessionExists) {
            throw new AppError(404, HTTP_STATUS_TEXT.FAIL, 'Session not found');
        }
        
        if (sessionExists.isPrimary){
            throw new AppError(400, HTTP_STATUS_TEXT.FAIL, 'Cannot terminate primary session');
        }

        await User.findOneAndUpdate(
            { _id: userId },
            { $pull: { refreshTokens: { _id: sessionId } } }
        );

        return { message: 'Session terminated successfully' };
    }

}

module.exports = new ProfileService();