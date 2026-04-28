const logger = require('../../../core/logger');
const socketEvents = require('../../constants/socket.events');
const chatService = require('./chat.service');

const getConversationId = (payload = {}) => {
  const conversationId = payload?.conversationId;
  return typeof conversationId === 'string' && conversationId.trim() ? conversationId : null;
};

const registerChatHandlers = (socket) => {
  socket.on(socketEvents.CHAT_JOIN, async (payload) => {
    const conversationId = getConversationId(payload);
    if (!conversationId) return;

    try {
      await chatService.joinConversation({ socket, conversationId });
    } catch (error) {
      logger.warn('Chat join rejected', {
        userId: socket.userId,
        conversationId,
        message: error.message,
      });
    }
  });

  socket.on(socketEvents.CHAT_LEAVE, async (payload) => {
    const conversationId = getConversationId(payload);
    if (!conversationId) return;

    try {
      await chatService.leaveConversation({ socket, conversationId });
    } catch (error) {
      logger.warn('Chat leave rejected', {
        userId: socket.userId,
        conversationId,
        message: error.message,
      });
    }
  });

  socket.on(socketEvents.CHAT_TYPING, async (payload) => {
    const conversationId = getConversationId(payload);
    if (!conversationId) return;

    try {
      await chatService.emitTyping({ socket, conversationId });
    } catch (error) {
      logger.warn('Chat typing rejected', {
        userId: socket.userId,
        conversationId,
        message: error.message,
      });
    }
  });

  socket.on(socketEvents.CHAT_STOP_TYPING, async (payload) => {
    const conversationId = getConversationId(payload);
    if (!conversationId) return;

    try {
      await chatService.emitStopTyping({ socket, conversationId });
    } catch (error) {
      logger.warn('Chat stop_typing rejected', {
        userId: socket.userId,
        conversationId,
        message: error.message,
      });
    }
  });
};

module.exports = {
  registerChatHandlers
};
