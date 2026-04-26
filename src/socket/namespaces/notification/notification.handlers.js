const logger = require('../../../core/logger');
const socketEvents = require('../../constants/socket.events');
const notificationService = require('./notification.service');

const registerNotificationHandlers = (socket) => {
  socket.on(socketEvents.NOTIFICATION_READ, async (payload) => {
    try {
      await notificationService.handleNotificationRead({ socket, payload });
    } catch (error) {
      logger.warn('Notification read handler failed', {
        userId: socket.userId,
        message: error.message,
      });
    }
  });
};

module.exports = {
  registerNotificationHandlers,
};
