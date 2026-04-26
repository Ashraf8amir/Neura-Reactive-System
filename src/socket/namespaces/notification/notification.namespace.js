const { registerNotificationHandlers } = require('./notification.handlers');

const initNotificationNamespace = (io) => {
  io.of('/notifications').on('connection', (socket) => {
    registerNotificationHandlers(socket);
  });
};

module.exports = {
  initNotificationNamespace
};
