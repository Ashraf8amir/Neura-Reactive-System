const express = require('express');
const patientController = require('./patient.controller');
const verifyToken = require('../../shared/middlewares/verifyToken.middleware.js');
const validateReq  = require('../../shared/middlewares/validation.middleware.js');
const patientValidators = require('./patient.validator.js');
const authorizeRoles = require('../../shared/middlewares/roleCheck.middleware.js');
const uploadMiddleware = require('../../shared/middlewares/upload.middleware.js');
const mediaController = require('../../modules/media/media.controller.js');
const { ROLE } = require('../../shared/constants/enums');
const Patient = require('./patient.model');

const router = express.Router();

router.use(verifyToken);
router.use(authorizeRoles(ROLE.PATIENT));

// ============ Profile Routes ============
router.get('/me',
    patientController.getMyProfile
);
router.get('/me/completeness',
    patientController.getProfileCompleteness
);

// ============ Basic Info Routes ============
router.get('/me/basic-info',
    patientController.getBasicInfo
);
router.patch('/me/basic-info',
    validateReq(patientValidators.updateBasicInfoSchema),
    patientController.updateBasicInfo
);

// ============ Medical Profile Routes ============
router.get('/me/medical-profile',
    patientController.getMedicalProfile
);
router.patch('/me/medical-profile',
    validateReq(patientValidators.updateMedicalProfileSchema),
    patientController.updateMedicalProfile
);

// --- Chronic Diseases ---
router.post('/me/medical-profile/chronic-diseases',
    validateReq(patientValidators.addChronicDiseaseSchema),
    patientController.addChronicDisease
);
router.patch('/me/medical-profile/chronic-diseases/:diseaseId',
    validateReq(patientValidators.updateChronicDiseaseSchema),
    patientController.updateChronicDisease
);
router.delete('/me/medical-profile/chronic-diseases/:diseaseId',
    patientController.deleteChronicDisease
);

// --- Allergies ---
router.post('/me/medical-profile/allergies',
    validateReq(patientValidators.addAllergySchema),
    patientController.addAllergy
);
router.patch('/me/medical-profile/allergies/:allergyId',
    validateReq(patientValidators.updateAllergySchema),
    patientController.updateAllergy
);
router.delete('/me/medical-profile/allergies/:allergyId',
    patientController.deleteAllergy
);

// --- Surgeries ---
router.post('/me/medical-profile/surgeries',
    validateReq(patientValidators.addSurgerySchema),
    patientController.addSurgery
);
router.patch('/me/medical-profile/surgeries/:surgeryId',
    validateReq(patientValidators.updateSurgerySchema),
    patientController.updateSurgery
);
router.delete('/me/medical-profile/surgeries/:surgeryId',
    patientController.deleteSurgery
);

// --- Family Medical History ---
router.post('/me/medical-profile/family-history',
    validateReq(patientValidators.addFamilyMedicalHistorySchema),
    patientController.addFamilyMedicalHistory
);
router.patch('/me/medical-profile/family-history/:familyMemberId',
    validateReq(patientValidators.updateFamilyMedicalHistorySchema),
    patientController.updateFamilyMedicalHistory
);
router.delete('/me/medical-profile/family-history/:familyMemberId',
    patientController.deleteFamilyMedicalHistory
);

// --- Medications ---
router.post('/me/medical-profile/medications',
    validateReq(patientValidators.addMedicationSchema),
    patientController.addMedication
);
router.patch('/me/medical-profile/medications/:medicationId',
    validateReq(patientValidators.updateMedicationSchema),
    patientController.updateMedication
);
router.delete('/me/medical-profile/medications/:medicationId',
    patientController.deleteMedication
);

// ============ Emergency Contacts Routes ============
router.get('/me/emergency-contacts',
    patientController.getEmergencyContacts
);
router.post('/me/emergency-contacts',
    validateReq(patientValidators.addEmergencyContactSchema),
    patientController.addEmergencyContact
);
router.patch('/me/emergency-contacts/:contactId',
    validateReq(patientValidators.updateEmergencyContactSchema),
    patientController.updateEmergencyContact
);
router.delete('/me/emergency-contacts/:contactId',
    patientController.deleteEmergencyContact
);

// ============ image profile Routes ============
router.post('/me/profile-image',
    uploadMiddleware.uploadProfileImage,
    mediaController.uploadProfileImageController(Patient, 'patients/profile-images')
);
router.delete('/me/profile-image',
    mediaController.deleteProfileImageController(Patient)
);

module.exports = router;