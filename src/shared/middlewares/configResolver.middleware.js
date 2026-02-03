const AppError = require('../../core/appError');

const resolveConfig = (configMap, errorMsg = '') => {
    return (req, res, next) => {
        const config = configMap[req.user.role];
        
        if (!config) {
            return next(new AppError(403, 'FORBIDDEN', errorMsg));
        }

        req.resConfig = config; 
        next();
    };
};

module.exports = resolveConfig;