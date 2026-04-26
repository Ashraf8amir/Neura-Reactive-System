const logger = require('../../../core/logger');
const socketEvents = require('../../constants/socket.events');
const roomState = require('./room.state');
const { emitToRoom } = require('../../services/emit.service');
const therapyRoomService = require('../../../modules/therapy-rooms/therapy-room.service');
const therapyRoomConstants = require('../../../modules/therapy-rooms/therapy-room.constant');

const hostGraceTimers = new Map();
const emptyRoomTimers = new Map();

const clearHostGraceTimer = (roomId) => {
  const timer = hostGraceTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    hostGraceTimers.delete(roomId);
  }
};

const clearEmptyRoomTimer = (roomId) => {
  const timer = emptyRoomTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    emptyRoomTimers.delete(roomId);
  }
};

const clearRoomTimers = (roomId) => {
  clearHostGraceTimer(roomId);
  clearEmptyRoomTimer(roomId);
};

const clearRoomRuntimeState = (roomId) => {
  clearRoomTimers(roomId);
  roomState.cleanupRoom(roomId);
};

const emitRoomEnded = (io, roomId, endedAt, reason) => {
  emitToRoom(
    io,
    roomId,
    socketEvents.ROOM_ENDED,
    { roomId, endedAt, reason },
    '/rooms'
  );
};

const endRoomFromRuntime = async (io, roomId, reason) => {
  try {
    const endedRoom = await therapyRoomService.endRoomBySystem(roomId);
    if (!endedRoom) return;

    emitRoomEnded(io, roomId, endedRoom.endedAt, reason);
    clearRoomRuntimeState(roomId);
  } catch (error) {
    logger.error('Failed to end room from runtime state', {
      roomId,
      reason,
      message: error.message
    });
  }
};

const startHostGraceTimer = (io, roomId) => {
  clearHostGraceTimer(roomId);
  const timeoutRef = setTimeout(() => {
    endRoomFromRuntime(io, roomId, 'host_grace_timeout');
  }, therapyRoomConstants.DEFAULTS.HOST_GRACE_PERIOD_MS);

  hostGraceTimers.set(roomId, timeoutRef);
};

const startEmptyRoomTimer = (io, roomId) => {
  clearEmptyRoomTimer(roomId);
  const timeoutRef = setTimeout(() => {
    endRoomFromRuntime(io, roomId, 'room_empty_timeout');
  }, therapyRoomConstants.DEFAULTS.EMPTY_ROOM_AUTO_END_MS);

  emptyRoomTimers.set(roomId, timeoutRef);
};

const joinRoom = async ({ io, socket, roomId }) => {
  const room = await therapyRoomService.getRoomAccessForSocket(roomId, socket.userId);
  const existingParticipant = roomState.getUser(roomId, socket.userId);
  const isReconnect = Boolean(existingParticipant);

  clearEmptyRoomTimer(roomId);
  if (room.hostId === socket.userId.toString()) {
    clearHostGraceTimer(roomId);
    await therapyRoomService.clearHostDisconnected(roomId);
  }

  roomState.addUser(roomId, socket.userId, {
    socketId: socket.id,
    name: room.participant?.name || existingParticipant?.name || null,
    profileImage: room.participant?.profileImage || existingParticipant?.profileImage || null,
    role: room.participant?.role || existingParticipant?.role || null,
    isMuted: existingParticipant ? existingParticipant.isMuted : true,
    handRaised: existingParticipant ? existingParticipant.handRaised : false
  });

  socket.join(roomId);

  if (!isReconnect) {
    const participantCount = roomState.getParticipants(roomId).length;
    await therapyRoomService.updatePeakConcurrent(roomId, participantCount);
  }

  socket.to(roomId).emit(socketEvents.ROOM_USER_JOINED, {
    roomId,
    userId: socket.userId,
    name: room.participant?.name || existingParticipant?.name || null,
    role: room.participant?.role || existingParticipant?.role || null,
    isReconnect
  });

  socket.emit(socketEvents.ROOM_PARTICIPANTS, {
    roomId,
    participants: roomState.getParticipants(roomId)
  });
};

const leaveRoom = async ({ io, socket, roomId }) => {
  const removed = roomState.removeUser(roomId, socket.userId);
  socket.leave(roomId);

  await therapyRoomService.removeParticipant(roomId, socket.userId);

  if (removed) {
    emitToRoom(
      io,
      roomId,
      socketEvents.ROOM_USER_LEFT,
      { roomId, userId: socket.userId },
      '/rooms'
    );
  }

  if (roomState.getParticipants(roomId).length === 0) {
    startEmptyRoomTimer(io, roomId);
  }
};

const raiseHand = ({ io, socket, roomId }) => {
  const participant = roomState.setHandRaised(roomId, socket.userId, true);
  emitToRoom(
    io,
    roomId,
    socketEvents.ROOM_HAND_RAISED,
    {
      roomId,
      userId: socket.userId,
      name: participant?.name || null
    },
    '/rooms'
  );
};

const lowerHand = ({ io, socket, roomId }) => {
  roomState.setHandRaised(roomId, socket.userId, false);
  emitToRoom(
    io,
    roomId,
    socketEvents.ROOM_HAND_LOWERED,
    { roomId, userId: socket.userId },
    '/rooms'
  );
};

const unmute = async ({ io, socket, roomId }) => {
  const roomMeta = await therapyRoomService.getRoomRuntimeMeta(roomId);
  if (!roomMeta) {
    throw new Error('Room is not active');
  }

  const participant = roomState.getUser(roomId, socket.userId);
  const isAlreadyUnmuted = participant?.isMuted === false;
  const activeMics = roomState.getActiveMicCount(roomId);

  if (!isAlreadyUnmuted && activeMics >= roomMeta.maxActiveMics) {
    socket.emit(socketEvents.ROOM_MIC_LIMIT, {
      roomId,
      message: 'Active mic limit reached',
      maxActiveMics: roomMeta.maxActiveMics
    });
    return;
  }

  roomState.setMuted(roomId, socket.userId, false);
  emitToRoom(
    io,
    roomId,
    socketEvents.ROOM_MUTE_CHANGED,
    { roomId, userId: socket.userId, isMuted: false },
    '/rooms'
  );
};

const mute = ({ io, socket, roomId }) => {
  roomState.setMuted(roomId, socket.userId, true);
  emitToRoom(
    io,
    roomId,
    socketEvents.ROOM_MUTE_CHANGED,
    { roomId, userId: socket.userId, isMuted: true },
    '/rooms'
  );
};

const handleSocketDisconnect = async (io, socket) => {
  const userRooms = roomState.getRoomsForUser(socket.userId);

  for (const entry of userRooms) {
    const { roomId, participant } = entry;

    if (participant.socketId !== socket.id) {
      continue;
    }

    const roomMeta = await therapyRoomService.getRoomRuntimeMeta(roomId);
    if (!roomMeta) {
      roomState.removeUser(roomId, socket.userId);
      continue;
    }

    const isHost = roomMeta.hostId?.toString() === socket.userId.toString();

    if (isHost) {
      await therapyRoomService.markHostDisconnected(roomId, new Date());
      startHostGraceTimer(io, roomId);

      emitToRoom(
        io,
        roomId,
        socketEvents.ROOM_HOST_AWAY,
        {
          roomId,
          hostId: socket.userId,
          gracePeriodSeconds: Math.floor(therapyRoomConstants.DEFAULTS.HOST_GRACE_PERIOD_MS / 1000),
        },
        '/rooms'
      );
      continue;
    }

    roomState.removeUser(roomId, socket.userId);
    await therapyRoomService.removeParticipant(roomId, socket.userId);

    emitToRoom(
      io,
      roomId,
      socketEvents.ROOM_USER_LEFT,
      { roomId, userId: socket.userId },
      '/rooms'
    );

    if (roomState.getParticipants(roomId).length === 0) {
      startEmptyRoomTimer(io, roomId);
    }
  }
};

module.exports = {
  joinRoom,
  leaveRoom,
  raiseHand,
  lowerHand,
  unmute,
  mute,
  handleSocketDisconnect,
  clearRoomRuntimeState,
  clearRoomTimers
};