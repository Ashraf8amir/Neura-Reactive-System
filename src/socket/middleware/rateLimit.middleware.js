const defaultLimits = require('../constants/default.limits');

const counters = new Map();

const checkLimit = (userId, event, limits = defaultLimits) => {
  const normalizedUserId = String(userId || '');
  const limit = limits[event];

  if (!normalizedUserId || !limit) {
    return { allowed: true };
  }

  const key = `${normalizedUserId}:${event}`;
  const now = Date.now();
  const current = counters.get(key);

  if (!current || now >= current.resetAt) {
    counters.set(key, {
      count: 1,
      resetAt: now + limit.windowMs
    });

    return { allowed: true };
  }

  if (current.count >= limit.max) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfter };
  }

  current.count += 1;
  counters.set(key, current);
  return { allowed: true };
};

const assertRateLimit = ({
  socket,
  eventName,
  limits = defaultLimits,
  errorEvent,
  errorMessage = 'Rate limit exceeded'
}) => {
  const { allowed, retryAfter } = checkLimit(socket.userId, eventName, limits);
  if (allowed) return { allowed: true };

  if (errorEvent) {
    socket.emit(errorEvent, { message: errorMessage, retryAfter });
  }

  return { allowed: false, retryAfter };
};

module.exports = {
  defaultLimits,
  checkLimit,
  assertRateLimit
};