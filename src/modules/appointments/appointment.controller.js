const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const Appointment = require('./appointment.model');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums.js');
const ApiResponse = require('../../core/apiResponse');
const service = require('./appointment.service');


/**
    * @desc    Create a new appointment
    * @route   POST /api/v1/appointments
    * @access  Private (Patients and Admins)
*/
exports.createAppointment = asyncWrapper(async (req, res) => {
    const newAppointment = await service.createAppointment(req.body, req.user);

    return new ApiResponse(
        res,
        201,
        HTTP_STATUS_TEXT.SUCCESS,
        'Appointment created successfully',
        newAppointment
    );
});