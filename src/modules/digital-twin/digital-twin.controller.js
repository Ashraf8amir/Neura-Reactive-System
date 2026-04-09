const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const ApiResponse = require('../../core/apiResponse');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const digitalTwinService = require('./digital-twin.service');

/**
 * @desc Get the authenticated patient's digital twin
 * @route GET /api/digital-twin/my-twin
 * @access Private (Patient)
*/
exports.getMyTwin = asyncWrapper(async (req, res) => {
    const twin = await digitalTwinService.getMyTwin(req.user.id);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Digital twin retrieved successfully',
        twin
    );
});

/**
 * @desc Get a specific patient's digital twin by ID
 * @route GET /api/digital-twin/:patientId
 * @access Private (Doctor)
*/
exports.getPatientTwin = asyncWrapper(async (req, res) => {
    const twin = await digitalTwinService.getPatientTwin(req.params.patientId);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'Patient digital twin retrieved successfully',
        twin
    );
});

/**
 * @desc Simulate patient what-if scenario (read-only)
 * @route POST /api/digital-twin/what-if
 * @access Private (Patient)
 */
exports.simulateWhatIf = asyncWrapper(async (req, res) => {
    const simulation = await digitalTwinService.simulateWhatIf(req.user.id, req.body.scenario);

    return new ApiResponse(
        res,
        200,
        HTTP_STATUS_TEXT.SUCCESS,
        'What-if simulation generated successfully',
        {
            scenario: req.body.scenario,
            simulation
        }
    );
});
