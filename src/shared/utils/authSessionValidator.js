const { verify } = require('jsonwebtoken');
const config = require('../../config/config.js');
const AppError = require('../../core/appError.js');
const { HTTP_STATUS_TEXT } = require('../constants/enums.js');
const User = require('../models/user.model.js');

const validateAccessTokenSession = async (token, options = {}) => {
  const {
    userSelect = 'refreshTokens',
    userNotFoundMessage = 'User not found',
    sessionRevokedMessage = 'Session revoked',
  } = options;

  const decoded = verify(token, config.jwtSecret);
  const user = await User.findById(decoded.id).select(userSelect);

  if (!user) {
    throw new AppError(401, HTTP_STATUS_TEXT.UNAUTHORIZED, userNotFoundMessage);
  }

  const sessionExists = user.refreshTokens?.id(decoded.sessionId);
  if (!sessionExists) {
    throw new AppError(401, HTTP_STATUS_TEXT.UNAUTHORIZED, sessionRevokedMessage);
  }

  return { decoded, user };
};

module.exports = {
  validateAccessTokenSession,
};