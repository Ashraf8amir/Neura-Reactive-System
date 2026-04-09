const express = require('express');
const controller = require('./digital-twin.controller');
const verifyToken = require('../../shared/middlewares/verifyToken.middleware');
const authorizeRoles = require('../../shared/middlewares/roleCheck.middleware');
const validateReq = require('../../shared/middlewares/validation.middleware');
const validators = require('./digital-twin.validator');
const { ROLE } = require('../../shared/constants/enums');

const router = express.Router();

router.use(verifyToken);

router.get('/my-twin',
    authorizeRoles(ROLE.PATIENT),
    controller.getMyTwin
);

router.post('/what-if',
    authorizeRoles(ROLE.PATIENT),
    validateReq(validators.simulateWhatIfSchema),
    controller.simulateWhatIf
);

router.get('/:patientId',
    authorizeRoles(ROLE.DOCTOR),
    validateReq(validators.getPatientTwinSchema),
    controller.getPatientTwin
);

module.exports = router;
