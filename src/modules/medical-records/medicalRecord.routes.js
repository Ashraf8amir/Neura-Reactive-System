const express = require('express');
const controller = require('./medicalRecord.controller');
const verifyToken = require('../../shared/middlewares/verifyToken.middleware');
const authorizeRoles = require('../../shared/middlewares/roleCheck.middleware');
const validateReq = require('../../shared/middlewares/validation.middleware');
const validators = require('./medicalRecord.validator');
const { ROLE } = require('../../shared/constants/enums');

const router = express.Router();

router.use(verifyToken);

router.post('/',
    authorizeRoles(ROLE.DOCTOR),
    validateReq(validators.createMedicalRecordSchema),
    controller.createRecord
);

router.get('/my-records',
    authorizeRoles(ROLE.PATIENT),
    validateReq(validators.getMyRecordsSchema),
    controller.getMyRecords
);

router.get('/:recordId',
    authorizeRoles(ROLE.DOCTOR, ROLE.PATIENT),
    validateReq(validators.getRecordByIdSchema),
    controller.getRecordById
);

router.get('/patient/:patientId',
    authorizeRoles(ROLE.DOCTOR),
    validateReq(validators.getPatientHistorySchema),
    controller.getPatientHistory
);


module.exports = router;