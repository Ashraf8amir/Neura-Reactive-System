const { Server } = require('socket.io');
const logger = require('../core/logger');
const socketEvents = require('./constants/socket.events');
const { authenticateSocket } = require('./middleware/auth.middleware');
const socketRegistry = require('./services/socket.registry');
const presenceService = require('./services/presence.service');
const { broadcast } = require('./services/emit.service');
const { initChatNamespace } = require('./namespaces/chat/chat.namespace');
const { initNotificationNamespace } = require('./namespaces/notification/notification.namespace');
const { initRoomNamespace } = require('./namespaces/room/room.namespace');
const roomService = require('./namespaces/room/room.service');

let ioInstance = null;

const emitPresence = (io, userId, status) => {
  const payload = status === 'online'
    ? presenceService.markOnline(userId)
    : presenceService.markOffline(userId);

  if (!payload) return;
  broadcast(io, socketEvents.USER_PRESENCE_CHANGED, payload, '/');
};

const emitOnlineUsersSnapshot = (socket) => {
  socket.emit(socketEvents.ONLINE_USERS_SNAPSHOT, presenceService.buildOnlineUsersSnapshot());
};

const onSocketConnected = (socket) => { 
  const userId = socket.userId.toString();
  socketRegistry.register(userId, socket.id);

  const wasOnline = socketRegistry.isOnline(userId);
  if (!wasOnline) {
    emitPresence(ioInstance, userId, "online");
  }

  socket.on(socketEvents.GET_ONLINE_USERS, () => {
    emitOnlineUsersSnapshot(socket);
  });

  socket.on("disconnect", () => {
    roomService.handleSocketDisconnect(ioInstance, socket).catch((error) => {
      logger.error("Room disconnect handler failed", {
        userId,
        socketId: socket.id,
        message: error.message
      });
    });

    socketRegistry.unregister(userId, socket.id);

    setTimeout(() => {
      if (!socketRegistry.isOnline(userId)) {
        emitPresence(ioInstance, userId, "offline");
      }
    }, 50);
  });
};

const initializeSocket = (httpServer) => {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    pingTimeout: 30000, 
    pingInterval: 10000,
    cors: {
      origin: true,
      credentials: true
    }
  });

  const namespaces = ['/', '/chat', '/notifications', '/rooms'].map((namespace) => ioInstance.of(namespace));
  
  namespaces.forEach((namespace) => {
    namespace.use(authenticateSocket);

    namespace.on('connect_error', (err) => {
      logger.error(`Socket Connection Error [${namespace.name}]: ${err.message}`);
    });

    namespace.on('connection', onSocketConnected);
  });

  initChatNamespace(ioInstance);
  initNotificationNamespace(ioInstance);
  initRoomNamespace(ioInstance);

  logger.info('Socket.IO initialized successfully');
  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized');
  }

  return ioInstance;
};

module.exports = {
  initializeSocket,
  getIO
};