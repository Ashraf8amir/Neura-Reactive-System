const Conversation = require('../../../modules/chat/conversation.model');
const socketRegistry = require('../../services/socket.registry');
const { validateParticipant, getConversationRoom } = require('../../../modules/chat/chat.helper');
const socketEvents = require('../../constants/socket.events');

const resolveConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId).select('doctorId patientId');
  validateParticipant(conversation, userId);
  return conversation;
};

const joinConversation = async ({ socket, conversationId }) => {
  await resolveConversation(conversationId, socket.userId);
  socket.join(getConversationRoom(conversationId));
};

const leaveConversation = async ({ socket, conversationId }) => {
  await resolveConversation(conversationId, socket.userId);
  socket.leave(getConversationRoom(conversationId));
};

const emitTyping = async ({ socket, conversationId }) => {
  if (!socketRegistry.isOnline(socket.userId)) return;

  await resolveConversation(conversationId, socket.userId);
  socket
    .to(getConversationRoom(conversationId))
    .emit(socketEvents.CHAT_TYPING, { conversationId, userId: socket.userId });
};

const emitStopTyping = async ({ socket, conversationId }) => {
  if (!socketRegistry.isOnline(socket.userId)) return;

  await resolveConversation(conversationId, socket.userId);
  socket
    .to(getConversationRoom(conversationId))
    .emit(socketEvents.CHAT_STOP_TYPING, { conversationId, userId: socket.userId });
};

module.exports = {
  joinConversation,
  leaveConversation,
  emitTyping,
  emitStopTyping
};