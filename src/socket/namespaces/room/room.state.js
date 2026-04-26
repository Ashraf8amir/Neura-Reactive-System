const roomState = new Map();

const normalizeId = (value) => (value === null || value === undefined ? null : String(value));

const initRoom = (roomId) => {
  const normalizedRoomId = normalizeId(roomId);
  if (!normalizedRoomId) return null;

  if (!roomState.has(normalizedRoomId)) {
    roomState.set(normalizedRoomId, new Map());
  }

  return roomState.get(normalizedRoomId);
};

const addUser = (roomId, userId, userData = {}) => {
  const normalizedRoomId = normalizeId(roomId);
  const normalizedUserId = normalizeId(userId);
  if (!normalizedRoomId || !normalizedUserId) return null;

  const usersMap = initRoom(normalizedRoomId);
  const existing = usersMap.get(normalizedUserId) || {};
  const merged = {
    ...existing,
    ...userData,
    socketId: userData.socketId || existing.socketId || null,
    name: userData.name || existing.name || null,
    profileImage: userData.profileImage || existing.profileImage || null,
    role: userData.role || existing.role || null,
    isMuted: typeof userData.isMuted === 'boolean' ? userData.isMuted : (existing.isMuted ?? true),
    handRaised: typeof userData.handRaised === 'boolean' ? userData.handRaised : (existing.handRaised ?? false),
  };

  usersMap.set(normalizedUserId, merged);
  return { userId: normalizedUserId, ...merged };
};

const getUser = (roomId, userId) => {
  const normalizedRoomId = normalizeId(roomId);
  const normalizedUserId = normalizeId(userId);
  if (!normalizedRoomId || !normalizedUserId) return null;

  const usersMap = roomState.get(normalizedRoomId);
  if (!usersMap) return null;

  const participant = usersMap.get(normalizedUserId);
  return participant ? { userId: normalizedUserId, ...participant } : null;
};

const removeUser = (roomId, userId) => {
  const normalizedRoomId = normalizeId(roomId);
  const normalizedUserId = normalizeId(userId);
  if (!normalizedRoomId || !normalizedUserId) return null;

  const usersMap = roomState.get(normalizedRoomId);
  if (!usersMap) return null;

  const removed = usersMap.get(normalizedUserId) || null;
  usersMap.delete(normalizedUserId);

  if (usersMap.size === 0) {
    roomState.delete(normalizedRoomId);
  }

  return removed ? { userId: normalizedUserId, ...removed } : null;
};

const setMuted = (roomId, userId, isMuted) => {
  const normalizedRoomId = normalizeId(roomId);
  const normalizedUserId = normalizeId(userId);
  if (!normalizedRoomId || !normalizedUserId) return null;

  const usersMap = roomState.get(normalizedRoomId);
  if (!usersMap || !usersMap.has(normalizedUserId)) return null;

  const user = usersMap.get(normalizedUserId);
  user.isMuted = Boolean(isMuted);
  usersMap.set(normalizedUserId, user);

  return { userId: normalizedUserId, ...user };
};

const setHandRaised = (roomId, userId, handRaised) => {
  const normalizedRoomId = normalizeId(roomId);
  const normalizedUserId = normalizeId(userId);
  if (!normalizedRoomId || !normalizedUserId) return null;

  const usersMap = roomState.get(normalizedRoomId);
  if (!usersMap || !usersMap.has(normalizedUserId)) return null;

  const user = usersMap.get(normalizedUserId);
  user.handRaised = Boolean(handRaised);
  usersMap.set(normalizedUserId, user);

  return { userId: normalizedUserId, ...user };
};

const getParticipants = (roomId) => {
  const normalizedRoomId = normalizeId(roomId);
  if (!normalizedRoomId) return [];

  const usersMap = roomState.get(normalizedRoomId);
  if (!usersMap) return [];

  return Array.from(usersMap.entries()).map(([userId, value]) => ({
    userId,
    ...value,
  }));
};

const getActiveMicCount = (roomId) =>
  getParticipants(roomId).filter((participant) => participant.isMuted === false).length;

const isInRoom = (roomId, userId) => Boolean(getUser(roomId, userId));

const getRoomsForUser = (userId) => {
  const normalizedUserId = normalizeId(userId);
  if (!normalizedUserId) return [];

  const matches = [];
  roomState.forEach((usersMap, roomId) => {
    const participant = usersMap.get(normalizedUserId);
    if (participant) {
      matches.push({
        roomId,
        participant: {
          userId: normalizedUserId,
          ...participant,
        },
      });
    }
  });

  return matches;
};

const cleanupRoom = (roomId) => {
  const normalizedRoomId = normalizeId(roomId);
  if (!normalizedRoomId) return;
  roomState.delete(normalizedRoomId);
};

const hasRoom = (roomId) => {
  const normalizedRoomId = normalizeId(roomId);
  if (!normalizedRoomId) return false;

  const usersMap = roomState.get(normalizedRoomId);
  return Boolean(usersMap && usersMap.size > 0);
};

module.exports = {
  initRoom,
  addUser,
  removeUser,
  setMuted,
  setHandRaised,
  getParticipants,
  getActiveMicCount,
  isInRoom,
  getRoomsForUser,
  cleanupRoom,
  hasRoom,
  getUser,
};