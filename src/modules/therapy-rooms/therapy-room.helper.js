const crypto = require('crypto');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const config = require('../../config/config');
const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const TherapyRoom = require('./therapy-room.model');
const therapyRoomConstants = require('./therapy-room.constant');

const userIdToAgoraUid = (userId) => {
  const normalizedUserId = String(userId);
  let hash = 0;

  for (let index = 0; index < normalizedUserId.length; index += 1) {
    hash = ((hash << 5) - hash) + normalizedUserId.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const generateRoomId = () => {
  const random = crypto.randomUUID().replace(/-/g, '');
  return random.slice(0, therapyRoomConstants.DEFAULTS.ROOM_ID_LENGTH);
};

const buildRoomLink = (roomCode) => `${config.frontendUrl}/therapy-rooms/join/${roomCode}`;

const generateAgoraToken = (roomId, userId, sessionDurationMs = 60 * 60 * 1000) => {
  if (!config.agoraAppId || !config.agoraAppCertificate) {
    throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Agora service is not configured');
  }

  const uid = userIdToAgoraUid(userId);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const durationSeconds = Math.ceil(sessionDurationMs / 1000);
  const expiryTimestamp = nowSeconds + durationSeconds + therapyRoomConstants.DEFAULTS.TOKEN_BUFFER_SECONDS;

  const token = RtcTokenBuilder.buildTokenWithUid(
    config.agoraAppId,
    config.agoraAppCertificate,
    roomId,
    uid,
    RtcRole.PUBLISHER,
    expiryTimestamp,
    expiryTimestamp
  );

  return { token, uid };
};

const generateUniqueRoomCode = async (session) => {
  const maxAttempts = therapyRoomConstants.DEFAULTS.ROOM_CODE_MAX_ATTEMPTS;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const exists = await TherapyRoom.findOne(
      {
        roomCode: code,
        status: {
          $in: [
            therapyRoomConstants.ROOM_STATUS.WAITING,
            therapyRoomConstants.ROOM_STATUS.ACTIVE,
          ],
        },
      },
      null,
      { session }
    );

    if (!exists) {
      return code;
    }
  }

  throw new AppError(500, HTTP_STATUS_TEXT.ERROR, 'Failed to generate unique room code');
};

module.exports = {
  userIdToAgoraUid,
  generateRoomId,
  buildRoomLink,
  generateAgoraToken,
  generateUniqueRoomCode,
};