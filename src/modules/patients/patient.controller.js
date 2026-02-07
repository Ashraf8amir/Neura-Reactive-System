const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums.js');
const ApiResponse = require('../../core/apiResponse');
const service = require('./patient.service');


/**
    * @desc    Get logged-in patient's profile completeness percentage
    * @route   GET /api/v1/patients/me/completeness
    * @access  Private (patient)
*/
exports.getProfileCompleteness = asyncWrapper(async (req, res) => {
    const {completeness, missing} = await service.getProfileCompletenessService(req.user.id);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Profile completeness retrieved successfully',
        { completeness, missing }
    );
});

// ============ Basic Info Controllers ============

/**
    * @desc    Get logged-in patient's basic info
    * @route   GET /api/v1/patients/me/basic-info
    * @access  Private (patient)
*/
exports.getBasicInfo = asyncWrapper(async (req, res) => {
    const basicInfo = await service.getBasicInfoService(req.user.id);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Basic info retrieved successfully',
        { basicInfo }
    );
});

/**
    * @desc    Update logged-in patient's basic info
    * @route   PATCH /api/v1/patients/me/basic-info
    * @access  Private (patient)
*/
exports.updateBasicInfo = asyncWrapper(async (req, res) => {
    const updatedBasicInfo = await service.updateBasicInfoService(req.user.id, req.body);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Basic info updated successfully',
        { updatedBasicInfo }
    );
});

// ============ Medical Profile Controllers ============

/**
    * @desc    Get logged-in patient's medical profile
    * @route   GET /api/v1/patients/me/medical-profile
    * @access  Private (patient)
*/
exports.getMedicalProfile = asyncWrapper(async (req, res) => {
    const medicalProfile = await service.getMedicalProfileService(req.user.id);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Medical profile retrieved successfully',
        { medicalProfile }
    );
});

/**
    * @desc    Update logged-in patient's medical profile
    * @route   PATCH /api/v1/patients/me/medical-profile
    * @access  Private (patient)
*/
exports.updateMedicalProfile = asyncWrapper(async (req, res) => {
    const updatedMedicalProfile = 
        await service.updateMedicalProfileService(req.user.id, req.body);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Medical profile updated successfully',
        { updatedMedicalProfile }
    );
});

// --- Chronic Diseases ---

/** 
    * @desc    Add a chronic disease to logged-in patient's medical profile
    * @route   POST /api/v1/patients/me/medical-profile/chronic-diseases
    * @access  Private (patient)
*/
exports.addChronicDisease = asyncWrapper(async (req, res) => {
    const newChronicDisease = await service.addChronicDiseaseService(req.user.id, req.body);

    return new ApiResponse(
        res,
        201,
        HTTP_STATUS_TEXT.SUCCESS,
        'Chronic disease added successfully',
        { newChronicDisease }
    );
});

/** 
    * @desc    Update a chronic disease in logged-in patient's medical profile
    * @route   PATCH /api/v1/patients/me/medical-profile/chronic-diseases/:diseaseId
    * @access  Private (patient)
*/
exports.updateChronicDisease = asyncWrapper(async (req, res) => {
    const updatedChronicDisease = 
        await service.updateChronicDiseaseService(req.user.id, req.params.diseaseId, req.body);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Chronic disease updated successfully',
        { updatedChronicDisease }
    );
});

/** 
    * @desc    Delete a chronic disease from logged-in patient's medical profile
    * @route   DELETE /api/v1/patients/me/medical-profile/chronic-diseases/:diseaseId
    * @access  Private (patient)
*/
exports.deleteChronicDisease = asyncWrapper(async (req, res) => {
    const deletedChronicDisease = 
        await service.deleteChronicDiseaseService(req.user.id, req.params.diseaseId);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Chronic disease deleted successfully',
        { deletedChronicDisease }
    );
});

// --- Allergies ---

/** 
    * @desc    Add an allergy to logged-in patient's medical profile
    * @route   POST /api/v1/patients/me/medical-profile/allergies
    * @access  Private (patient)
*/
exports.addAllergy = asyncWrapper(async (req, res) => {
    const newAllergy = await service.addAllergyService(req.user.id, req.body);

    return new ApiResponse(
        res,
        201,
        HTTP_STATUS_TEXT.SUCCESS,
        'Allergy added successfully',
        { newAllergy }
    );
}); 

/** 
    * @desc    Update an allergy in logged-in patient's medical profile
    * @route   PATCH /api/v1/patients/me/medical-profile/allergies/:allergyId
    * @access  Private (patient)
*/
exports.updateAllergy = asyncWrapper(async (req, res) => {
    const updatedAllergy = 
        await service.updateAllergyService(req.user.id, req.params.allergyId, req.body);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Allergy updated successfully',
        { updatedAllergy }
    );
});

/** 
    * @desc    Delete an allergy from logged-in patient's medical profile
    * @route   DELETE /api/v1/patients/me/medical-profile/allergies/:allergyId
    * @access  Private (patient)
*/
exports.deleteAllergy = asyncWrapper(async (req, res) => {
    const deletedAllergy = await service.deleteAllergyService(req.user.id, req.params.allergyId);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Allergy deleted successfully',
        { deletedAllergy }
    );
});

// --- Surgeries ---

/** 
    * @desc    Add a surgery to logged-in patient's medical profile
    * @route   POST /api/v1/patients/me/medical-profile/surgeries
    * @access  Private (patient)
*/
exports.addSurgery = asyncWrapper(async (req, res) => {
    const newSurgery = await service.addSurgeryService(req.user.id, req.body);

    return new ApiResponse(
        res,
        201,
        HTTP_STATUS_TEXT.SUCCESS,
        'Surgery added successfully',
        { newSurgery }
    );
});

/** 
    * @desc    Update a surgery in logged-in patient's medical profile
    * @route   PATCH /api/v1/patients/me/medical-profile/surgeries/:surgeryId
    * @access  Private (patient)
*/
exports.updateSurgery = asyncWrapper(async (req, res) => {
    const updatedSurgery = 
        await service.updateSurgeryService(req.user.id, req.params.surgeryId, req.body);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Surgery updated successfully',
        { updatedSurgery }
    );
});

/** 
    * @desc    Delete a surgery from logged-in patient's medical profile
    * @route   DELETE /api/v1/patients/me/medical-profile/surgeries/:surgeryId
    * @access  Private (patient)
*/
exports.deleteSurgery = asyncWrapper(async (req, res) => {
    const deletedSurgery = 
        await service.deleteSurgeryService(req.user.id, req.params.surgeryId);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Surgery deleted successfully',
        { deletedSurgery }
    );
});

// --- Family Medical History ---

/** 
    * @desc    Add family medical history to logged-in patient's medical profile
    * @route   POST /api/v1/patients/me/medical-profile/family-history
    * @access  Private (patient)
*/
exports.addFamilyMedicalHistory = asyncWrapper(async (req, res) => {
    const newFamilyMedicalHistory = 
        await service.addFamilyMedicalHistoryService(req.user.id, req.body);
        
    return new ApiResponse(
        res,
        201,
        HTTP_STATUS_TEXT.SUCCESS,
        'Family medical history added successfully',
        { newFamilyMedicalHistory }
    );
});

/** 
    * @desc    Update family medical history in logged-in patient's medical profile
    * @route   PATCH /api/v1/patients/me/medical-profile/family-history/:familyMemberId
    * @access  Private (patient)
*/
exports.updateFamilyMedicalHistory = asyncWrapper(async (req, res) => {
    const updatedFamilyMedicalHistory = 
        await service.updateFamilyMedicalHistoryService(req.user.id, req.params.familyMemberId, req.body);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Family medical history updated successfully',
        { updatedFamilyMedicalHistory }
    );
});

/** 
    * @desc    Delete family medical history from logged-in patient's medical profile
    * @route   DELETE /api/v1/patients/me/medical-profile/family-history/:familyMemberId
    * @access  Private (patient)
*/
exports.deleteFamilyMedicalHistory = asyncWrapper(async (req, res) => {
    const deletedFamilyMedicalHistory = 
        await service.deleteFamilyMedicalHistoryService(req.user.id, req.params.familyMemberId);
        
    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Family medical history deleted successfully',
        { deletedFamilyMedicalHistory }
    );
});

// --- Medications ---

/** 
    * @desc    Add medication to logged-in patient's medical profile
    * @route   POST /api/v1/patients/me/medical-profile/medications
    * @access  Private (patient)
*/
exports.addMedication = asyncWrapper(async (req, res) => {
    const newMedication = await service.addMedicationService(req.user.id, req.body);

    return new ApiResponse(
        res,
        201,
        HTTP_STATUS_TEXT.SUCCESS,
        'Medication added successfully',
        { newMedication }
    );
});
/** 
    * @desc    Update medication in logged-in patient's medical profile
    * @route   PATCH /api/v1/patients/me/medical-profile/medications/:medicationId
    * @access  Private (patient)
*/
exports.updateMedication = asyncWrapper(async (req, res) => {
    const updatedMedication = 
        await service.updateMedicationService(req.user.id, req.params.medicationId, req.body);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Medication updated successfully',
        { updatedMedication }
    );
});
/** 
    * @desc    Delete medication from logged-in patient's medical profile
    * @route   DELETE /api/v1/patients/me/medical-profile/medications/:medicationId
    * @access  Private (patient)
*/
exports.deleteMedication = asyncWrapper(async (req, res) => {
    const deletedMedication = 
        await service.deleteMedicationService(req.user.id, req.params.medicationId);
    
    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Medication deleted successfully',
        { deletedMedication }
    );
});

// ============ Emergency Contacts Controllers ============
/** 
    * @desc    Get logged-in patient's emergency contacts
    * @route   GET /api/v1/patients/me/emergency-contacts
    * @access  Private (patient)
*/
exports.getEmergencyContacts = asyncWrapper(async (req, res) => {
    const emergencyContacts = await service.getEmergencyContactsService(req.user.id);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Emergency contacts retrieved successfully',
        { emergencyContacts }
    );
});
/** 
    * @desc    Add an emergency contact to logged-in patient's profile
    * @route   POST /api/v1/patients/me/emergency-contacts
    * @access  Private (patient)
*/
exports.addEmergencyContact = asyncWrapper(async (req, res) => {
    const newEmergencyContact = await service.addEmergencyContactService(req.user.id, req.body);

    return new ApiResponse(
        res,
        201,
        HTTP_STATUS_TEXT.SUCCESS,
        'Emergency contact added successfully',
        { newEmergencyContact }
    );
});
/** 
    * @desc    Update an emergency contact in logged-in patient's profile
    * @route   PATCH /api/v1/patients/me/emergency-contacts/:contactId
    * @access  Private (patient)
*/
exports.updateEmergencyContact = asyncWrapper(async (req, res) => {
    const updatedEmergencyContact =
        await service.updateEmergencyContactService(req.user.id, req.params.contactId, req.body);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Emergency contact updated successfully',
        { updatedEmergencyContact }
    );
});
/** 
    * @desc    Delete an emergency contact from logged-in patient's profile
    * @route   DELETE /api/v1/patients/me/emergency-contacts/:contactId
    * @access  Private (patient)
*/
exports.deleteEmergencyContact = asyncWrapper(async (req, res) => {
    const deletedEmergencyContact = 
        await service.deleteEmergencyContactService(req.user.id, req.params.contactId);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Emergency contact deleted successfully',
        { deletedEmergencyContact }
    );    
});