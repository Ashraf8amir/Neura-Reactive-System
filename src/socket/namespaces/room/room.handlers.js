const socketEvents = require('../../constants/socket.events');
const roomState = require('./room.state');
const roomService = require('./room.service');
const { assertRateLimit } = require('../../middleware/rateLimit.middleware');

const getRoomId = (payload = {}) => {
  const roomId = payload?.roomId;
  return typeof roomId === 'string' && roomId.trim() ? roomId : null;
};

const emitRoomError = (socket, message) => {
  socket.emit(socketEvents.ROOM_ERROR, { message });
};

const ensureRateLimit = (socket, eventName) =>
  assertRateLimit({
    socket,
    eventName,
    errorEvent: socketEvents.ROOM_ERROR,
    errorMessage: 'Rate limit exceeded'
  }).allowed;

const ensureInRoom = (socket, roomId) => {
  if (!roomState.isInRoom(roomId, socket.userId)) {
    emitRoomError(socket, 'You are not in this room');
    return false;
  }
  return true;
};

const registerRoomHandlers = (io, socket) => {
  socket.on(socketEvents.ROOM_JOIN, async (payload) => {
    if (!ensureRateLimit(socket, socketEvents.ROOM_JOIN)) return;

    const roomId = getRoomId(payload);
    if (!roomId) {
      emitRoomError(socket, 'roomId is required');
      return;
    }

    try {
      await roomService.joinRoom({ io, socket, roomId });
    } catch (error) {
      emitRoomError(socket, error.message);
    }
  });

  socket.on(socketEvents.ROOM_LEAVE, async (payload) => {
    if (!ensureRateLimit(socket, socketEvents.ROOM_LEAVE)) return;

    const roomId = getRoomId(payload);
    if (!roomId) {
      emitRoomError(socket, 'roomId is required');
      return;
    }

    try {
      await roomService.leaveRoom({ io, socket, roomId });
    } catch (error) {
      emitRoomError(socket, error.message);
    }
  });

  socket.on(socketEvents.ROOM_RAISE_HAND, async (payload) => {
    if (!ensureRateLimit(socket, socketEvents.ROOM_RAISE_HAND)) return;

    const roomId = getRoomId(payload);
    if (!roomId) {
      emitRoomError(socket, 'roomId is required');
      return;
    }

    if (!ensureInRoom(socket, roomId)) return;
    try {
      await roomService.raiseHand({ io, socket, roomId });
    } catch (error) {
      emitRoomError(socket, error.message);
    }
  });

  socket.on(socketEvents.ROOM_LOWER_HAND, async (payload) => {
    if (!ensureRateLimit(socket, socketEvents.ROOM_LOWER_HAND)) return;

    const roomId = getRoomId(payload);
    if (!roomId) {
      emitRoomError(socket, 'roomId is required');
      return;
    }

    if (!ensureInRoom(socket, roomId)) return;

    try {
      await roomService.lowerHand({ io, socket, roomId });
    } catch (error) {
      emitRoomError(socket, error.message);
    }
  });

  socket.on(socketEvents.ROOM_UNMUTE, async (payload) => {
    if (!ensureRateLimit(socket, socketEvents.ROOM_UNMUTE)) return;

    const roomId = getRoomId(payload);
    if (!roomId) {
      emitRoomError(socket, 'roomId is required');
      return;
    }

    if (!ensureInRoom(socket, roomId)) return;

    try {
      await roomService.unmute({ io, socket, roomId });
    } catch (error) {
      emitRoomError(socket, error.message);
    }
  });

  socket.on(socketEvents.ROOM_MUTE, async (payload) => {
    if (!ensureRateLimit(socket, socketEvents.ROOM_MUTE)) return;

    const roomId = getRoomId(payload);
    if (!roomId) {
      emitRoomError(socket, 'roomId is required');
      return;
    }

    if (!ensureInRoom(socket, roomId)) return;
    try {       
      await roomService.mute({ io, socket, roomId });
    } catch (error) {
      emitRoomError(socket, error.message);
    }
  });
};

module.exports = {
  registerRoomHandlers
};