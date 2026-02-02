const { verify } = require('jsonwebtoken');
const config = require('../../config/config.js');
const AppError = require('../../core/appError.js');
const { HTTP_STATUS_TEXT } = require('../constants/enums.js');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        return next(new AppError(401, HTTP_STATUS_TEXT.UNAUTHORIZED, 'No access token provided'));
    }
    try {
        const decoded = verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError(401, HTTP_STATUS_TEXT.UNAUTHORIZED, 'Access token expired'));
        } else if (error.name === 'JsonWebTokenError') {
            return next(new AppError(401, HTTP_STATUS_TEXT.UNAUTHORIZED, 'Invalid access token'));
        } else {
            return next(new AppError(401, HTTP_STATUS_TEXT.UNAUTHORIZED, 'Token verification failed'));
        }
    }
}

module.exports = verifyToken;