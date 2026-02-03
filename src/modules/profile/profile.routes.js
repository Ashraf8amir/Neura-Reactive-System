const express = require('express');
const verifyToken = require('../../shared/middlewares/verifyToken.middleware');
const uploadMiddleware = require('../../shared/middlewares/upload.middleware');
const resolveConfig = require('../../shared/middlewares/configResolver.middleware');
const profileController = require('./profile.controller');
const profileConstants = require('./profile.constant');

const router = express.Router();

router.use(verifyToken);

router.get('/me', 
    profileController.getMe
);
router.delete('/soft-delete-me', 
    profileController.softDeleteMe
);
router.post('/profile-image',
	uploadMiddleware.uploadProfileImage,
	resolveConfig(profileConstants.ROLE_CONFIG, 'Profile image upload not allowed for this role'),
	profileController.uploadProfileImageController
);
router.delete('/profile-image',
	resolveConfig(profileConstants.ROLE_CONFIG, 'Profile image deletion not allowed for this role'),
	profileController.deleteProfileImageController
);
router.get('/me/sessions',
	profileController.getActiveSessions
);
router.delete('/me/sessions/:sessionId',
    profileController.terminateSession
);

module.exports = router;