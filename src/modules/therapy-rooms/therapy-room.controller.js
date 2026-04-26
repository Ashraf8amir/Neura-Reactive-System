const asyncWrapper = require('../../shared/middlewares/asyncWrapper.middleware');
const ApiResponse = require('../../core/apiResponse');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const socketEvents = require('../../socket/constants/socket.events');
const { clearRoomRuntimeState } = require('../../socket/namespaces/room/room.service');
const therapyRoomService = require('./therapy-room.service');
const config = require('../../config/config');

/**
 *  @desc    Create a new therapy room
 *  @route   POST /api/v1/therapy-rooms
 *  @access  Private (Therapists only)
*/
exports.createRoom = asyncWrapper(async (req, res) => {
  const room = await therapyRoomService.createRoom(req.body, req.user);

  return new ApiResponse(
    res,
    201,
    HTTP_STATUS_TEXT.CREATED,
    'Therapy room created successfully',
    room
  );
});

/**
 *  @desc    Get list of active therapy rooms
 *  @route   GET /api/v1/therapy-rooms
 *  @access  Public
*/
exports.getActiveRooms = asyncWrapper(async (req, res) => {
  const rooms = await therapyRoomService.getActiveRooms();

  return new ApiResponse(
    res,
    200,
    HTTP_STATUS_TEXT.SUCCESS,
    'Therapy rooms retrieved successfully',
    rooms
  );
});

/**
 *  @desc    Join a therapy room by code
 *  @route   GET /api/v1/therapy-rooms/join/:code
 *  @access  Private
*/
exports.joinRoomByCode = asyncWrapper(async (req, res) => {
  const room = await therapyRoomService.joinRoomByCode(req.params.code, req.user);

  return new ApiResponse(
    res,
    200,
    HTTP_STATUS_TEXT.SUCCESS,
    'Joined therapy room successfully',
    {
      ...room,
      agoraAppId: config.agoraAppId,
      channelName: room.roomId,
    }
  );
});

/**
 *  @desc    Get Agora token for a therapy room
 *  @route   POST /api/v1/therapy-rooms/:roomId/token
 *  @access  Private (Must be a participant of the room)
*/
exports.getRoomToken = asyncWrapper(async (req, res) => {
  const tokenData = await therapyRoomService.getRoomToken(req.params.roomId, req.user);

  return new ApiResponse(
    res,
    200,
    HTTP_STATUS_TEXT.SUCCESS,
    'Agora token generated successfully',
    {
      ...tokenData,
      agoraAppId: config.agoraAppId,
    }
  );
});

/**
 *  @desc    Get details of a therapy room
 *  @route   GET /api/v1/therapy-rooms/:roomId
 *  @access  Private (Must be a participant of the room)
*/
exports.getRoomDetails = asyncWrapper(async (req, res) => {
  const room = await therapyRoomService.getRoomDetails(req.params.roomId, req.user);

  return new ApiResponse(
    res,
    200,
    HTTP_STATUS_TEXT.SUCCESS,
    'Therapy room retrieved successfully',
    room
  );
});

/**
 *  @desc    End a therapy room
 *  @route   PATCH /api/v1/therapy-rooms/:roomId/end
 *  @access  Private (Host only)
*/
exports.endRoom = asyncWrapper(async (req, res) => {
  const room = await therapyRoomService.endRoomByHost(req.params.roomId, req.user);
  const io = req.app.get('io');

  if (io && room) {
    io.of('/rooms').to(req.params.roomId).emit(socketEvents.ROOM_ENDED, {
      roomId: req.params.roomId,
      endedAt: room.endedAt,
      reason: 'host_ended',
    });
  }

  clearRoomRuntimeState(req.params.roomId);

  return new ApiResponse(
    res,
    200,
    HTTP_STATUS_TEXT.SUCCESS,
    'Therapy room ended successfully',
    room
  );
});