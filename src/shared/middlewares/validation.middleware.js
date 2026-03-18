const AppError = require('../../core/appError.js');
const { HTTP_STATUS_TEXT } = require('../constants/enums.js');


const validateRequest = (schema) => {
    return (req, res, next) => {
        const toValidate = {
            body: req.body,
            query: req.query,
            params: req.params
        };

        const { error, value } = schema.validate(toValidate, { 
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return next(new AppError(
                400, 
                HTTP_STATUS_TEXT.FAIL, 
                errors.length === 1 ? errors[0].message : 'Validation failed'
            ));
        }

        if (value.body) req.body = value.body;
        if (value.query) req.query = value.query;
        if (value.params) req.params = value.params;

        next();
    };
};

module.exports = validateRequest;
