const { registerChatHandlers } = require('./chat.handlers');

const initChatNamespace = (io) => {
  io.of('/chat').on('connection', (socket) => {
    registerChatHandlers(socket);
  });
};

module.exports = {
  initChatNamespace
};