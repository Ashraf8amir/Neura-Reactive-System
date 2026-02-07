const express = require('express');
const appointmentController = require('./appointment.controller');
const verifyToken = require('../../shared/middlewares/verifyToken.middleware.js');
const validateReq = require('../../shared/middlewares/validation.middleware.js'); 
const appointmentValidators = require('./appointment.validator.js');
const authorizeRoles = require('../../shared/middlewares/roleCheck.middleware.js');
const { ROLE } = require('../../shared/constants/enums');

const router = express.Router();

router.use(verifyToken);

router.post('/',
    authorizeRoles(ROLE.PATIENT, ROLE.DOCTOR, ROLE.ADMIN),
    validateReq(appointmentValidators.createAppointmentSchema),
    appointmentController.createAppointment
);

module.exports = router;