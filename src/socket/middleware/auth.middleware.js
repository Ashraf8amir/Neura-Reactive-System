const AppError = require('../../core/appError');
const { HTTP_STATUS_TEXT } = require('../../shared/constants/enums');
const { validateAccessTokenSession } = require('../../shared/utils/authSessionValidator');

const extractToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  const headerToken = socket.handshake?.headers?.authorization;
  const rawToken = authToken || headerToken;

  if (!rawToken) return null;
  if (rawToken.startsWith('Bearer ')) {
    return rawToken.split(' ')[1];
  }

  return rawToken;
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = extractToken(socket);
    if (!token) {
      return next(new AppError(401, HTTP_STATUS_TEXT.UNAUTHORIZED, 'Unauthorized: token missing'));
    }

    const { decoded } = await validateAccessTokenSession(token, {
      userSelect: 'refreshTokens role',
      userNotFoundMessage: 'Unauthorized: user not found',
      sessionRevokedMessage: 'Unauthorized: session revoked'
    });

    socket.userId = decoded.id.toString();
    socket.user = {
      id: decoded.id.toString(),
      role: decoded.role,
      email: decoded.email
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError(401, HTTP_STATUS_TEXT.UNAUTHORIZED, 'Unauthorized: invalid token'));
  }
};

module.exports = {
  extractToken,
  authenticateSocket
};