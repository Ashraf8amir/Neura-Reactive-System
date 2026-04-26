const { registerRoomHandlers } = require('./room.handlers');

const initRoomNamespace = (io) => {
  io.of('/rooms').on('connection', (socket) => {
    registerRoomHandlers(io, socket);
  });
};

module.exports = {
  initRoomNamespace
};