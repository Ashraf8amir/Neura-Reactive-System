class AppError extends Error {
    constructor(statusCode, statusText, message) {
        super(message);
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;