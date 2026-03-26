const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const ApiResponse = require('../../core/apiResponse');
const medicalRecordService = require('./medicalRecord.service');

/**
 * POST /api/v1/medical-records
 * Create a new medical record (doctor only)
 */
exports.createRecord = asyncWrapper(async (req, res) => {
    const record = await medicalRecordService.createRecord(req.user.id, req.body);

    return new ApiResponse(
        res,
        201,
        HTTP_STATUS_TEXT.CREATED,
        'Medical record created successfully',
        record
    );
});

/**
 * GET /api/v1/medical-records/my-records
 * Get all records for the logged-in patient
 */
exports.getMyRecords = asyncWrapper(async (req, res) => {
    const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10
    };

    const { data, pagination } = await medicalRecordService.getPatientOwnRecords(req.user.id, options);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Medical records retrieved successfully',
        data,
        pagination
    );
});

/**
 * GET /api/v1/medical-records/:recordId
 * Get a single record by ID
 */
exports.getRecordById = asyncWrapper(async (req, res) => {
    const record = await medicalRecordService.getRecordById(req.params.recordId, req.user);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Medical record retrieved successfully',
        record
    );
});

/**
 * GET /api/v1/medical-records/patient/:patientId
 * Get full medical history for a patient (doctor only)
 */
exports.getPatientHistory = asyncWrapper(async (req, res) => {
    const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10
    };

    const { data, pagination } = await medicalRecordService.getPatientHistoryForDoctor(req.params.patientId, options);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Patient medical history retrieved successfully',
        data,
        pagination
    );
});