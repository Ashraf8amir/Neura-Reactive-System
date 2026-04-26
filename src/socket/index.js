const { initializeSocket, getIO } = require('./gateway');
const socketEvents = require('./constants/socket.events');

module.exports = {
  initializeSocket,
  getIO,
  socketEvents
};