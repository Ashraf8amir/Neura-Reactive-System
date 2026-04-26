const onlinePresenceCache = new Set();

const normalizeUserId = (userId) => {
  if (!userId) return null;
  return String(userId);
};

const updatePresenceState = (userId, status) => {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) return null;

  const isOnline = onlinePresenceCache.has(normalizedUserId);

  if (status === 'online' && isOnline) return null;
  if (status === 'offline' && !isOnline) return null;

  if (status === 'online') {
    onlinePresenceCache.add(normalizedUserId);
  } else {
    onlinePresenceCache.delete(normalizedUserId);
  }

  return {
    userId: normalizedUserId,
    status,
    changedAt: new Date().toISOString()
  };
};

const markOnline = (userId) => updatePresenceState(userId, 'online');

const markOffline = (userId) => updatePresenceState(userId, 'offline');

const getOnlineUsers = () => Array.from(onlinePresenceCache);

const buildOnlineUsersSnapshot = () => ({
  onlineUsers: getOnlineUsers(),
  generatedAt: new Date().toISOString()
});

module.exports = {
  markOnline,
  markOffline,
  getOnlineUsers,
  buildOnlineUsersSnapshot
};