const express = require('express');
const verifyToken = require('../../shared/middlewares/verifyToken.middleware');
const uploadMiddleware = require('../../shared/middlewares/upload.middleware');
const mediaController = require('./media.controller');
const AppError = require('../../core/appError');
const { ROLE, HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const Patient = require('../patients/patient.model');
const Doctor = require('../doctors/doctor.model');

const router = express.Router();

const roleConfig = {
	[ROLE.PATIENT]: { model: Patient, folder: 'patients/profile-images' },
	[ROLE.DOCTOR]: { model: Doctor, folder: 'doctors/profile-images' },
    //[ROLE.NURSE]: { model: Nurse, folder: 'nurses/profile-images' },
    //[ROLE.PHARMACY]: { model: Pharmacy, folder: 'pharmacies/profile-images' },
};

const resolveProfileImageConfig = (req, res, next) => {
	const config = roleConfig[req.user.role];
	if (!config) {
		return next(new AppError(403, HTTP_STATUS_TEXT.FORBIDDEN, 'Role not allowed to manage profile image'));
	}
	req.profileImageConfig = config;
	return next();
};

router.use(verifyToken);

router.post('/profile-image',
	uploadMiddleware.uploadProfileImage,
	resolveProfileImageConfig,
	(req, res, next) => mediaController.uploadProfileImageController(
		req.profileImageConfig.model,
		req.profileImageConfig.folder
	)(req, res, next)
);

router.delete('/profile-image',
	resolveProfileImageConfig,
	(req, res, next) => mediaController.deleteProfileImageController(
		req.profileImageConfig.model
	)(req, res, next)
);

module.exports = router;