const { verify } = require('jsonwebtoken');
const config = require('../../config/config.js');
const AppError = require('../../core/appError.js');
const httpStatus = require('../../core/httpStatus.js');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
        return next(new AppError(401, httpStatus.UNAUTHORIZED, 'No access token provided'));
    }
    try {
        const decoded = verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError(401, httpStatus.UNAUTHORIZED, 'Access token expired'));
        } else if (error.name === 'JsonWebTokenError') {
            return next(new AppError(401, httpStatus.UNAUTHORIZED, 'Invalid access token'));
        } else {
            return next(new AppError(401, httpStatus.UNAUTHORIZED, 'Token verification failed'));
        }
    }
}

module.exports = verifyToken;