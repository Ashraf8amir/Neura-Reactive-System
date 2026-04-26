const socketRegistry = require('./socket.registry');

const getNamespace = (io, namespace = '/') => io.of(namespace || '/');

const emitToRoom = (io, room, event, payload, namespace = '/') => {
  if (!io || !room) return;
  getNamespace(io, namespace).to(room).emit(event, payload);
};

const emitToSocket = (io, socketId, event, payload, namespace = '/') => {
  if (!io || !socketId) return;
  getNamespace(io, namespace).to(socketId).emit(event, payload);
};

const emitToUser = (io, userId, event, payload, namespace = '/') => {
  if (!io || !userId) return;

  const socketIds = socketRegistry.getSocketIds(userId);
  socketIds.forEach((socketId) => {
    emitToSocket(io, socketId, event, payload, namespace);
  });
};

const broadcast = (io, event, payload, namespace = '/') => {
  if (!io) return;
  getNamespace(io, namespace).emit(event, payload);
};

module.exports = {
  emitToRoom,
  emitToSocket,
  emitToUser,
  broadcast
};