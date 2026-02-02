const { HTTP_STATUS_TEXT } = require('../constants/enums.js');
const config = require('../../config/config.js');
const logger = require('../../core/logger.js');

const globalErrorHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError) {
        return res.status(err.statusCode).json({
            status: err.statusText,
            message: err.message
        })
    }
    
    const isDev = config.nodeEnv === 'development';
    if (isDev) {
        logger.error('Error', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query
        });
    } else {
        logger.error('Error occurred:', {
            message: err.message,
            url: req.url,
            method: req.method,
            statusCode: err.statusCode,
            timestamp: new Date().toISOString()
        });
    }

    res.status(err.statusCode || 500).json({
        status: HTTP_STATUS_TEXT.ERROR,
        message: err.message || 'Internal Server Error'
    })

}

module.exports = globalErrorHandler;