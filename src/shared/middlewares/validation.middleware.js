const AppError = require('../../core/appError.js');
const httpStatus = require('../../core/httpStatus.js');

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema(req.body);
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }));

            return next(new AppError(
                400, 
                httpStatus.FAIL, 
                errors.length === 1 ? errors[0].message : 'Validation failed'
            ));
        }

        next();
    };
};

module.exports =  validateRequest ;