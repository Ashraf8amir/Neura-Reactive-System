const express = require('express');
const verifyToken = require('../../shared/middlewares/verifyToken.middleware');
const authorizeRoles = require('../../shared/middlewares/roleCheck.middleware');
const validateReq = require('../../shared/middlewares/validation.middleware');
const { ROLE } = require('../../shared/constants/enums');
const therapyRoomController = require('./therapy-room.controller');
const therapyRoomValidator = require('./therapy-room.validator');

const router = express.Router();

router.use(verifyToken);

router.post('/',
  authorizeRoles(ROLE.DOCTOR, ROLE.ADMIN),
  validateReq(therapyRoomValidator.createRoomSchema),
  therapyRoomController.createRoom
);

router.get('/', therapyRoomController.getActiveRooms);

router.get('/join/:code',
  validateReq(therapyRoomValidator.joinByCodeSchema),
  therapyRoomController.joinRoomByCode
);

router.post('/:roomId/token',
  validateReq(therapyRoomValidator.roomIdParamSchema),
  therapyRoomController.getRoomToken
);

router.get('/:roomId',
  validateReq(therapyRoomValidator.roomIdParamSchema),
  therapyRoomController.getRoomDetails
);

router.patch('/:roomId/end',
  authorizeRoles(ROLE.DOCTOR, ROLE.ADMIN),
  validateReq(therapyRoomValidator.roomIdParamSchema),
  therapyRoomController.endRoom
);

module.exports = router;