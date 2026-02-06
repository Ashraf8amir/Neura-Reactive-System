const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');

exports.getCookieConfig = () => {
    const isProduction = config.nodeEnv === 'production';
    
    return {
        refresh: {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'None' : 'strict',
            maxAge: config.refreshTokenExpiresIn.split('d')[0] * 24 * 60 * 60 * 1000, 
            path: '/' 
        }
    };
};
exports.generateAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      sessionId,
    },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpiresIn }
  );
};
exports.generateRefreshToken = () => {
  return crypto.randomBytes(config.refreshTokenLength).toString('hex');
};

exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.generateResetToken = () => {
    return crypto.randomBytes(config.resetTokenLength).toString('hex');
};

exports.hashResetToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

exports.hashedPassword = async (password) => {
    const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};
