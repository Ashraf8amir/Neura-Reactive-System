const AppError = require("../../core/appError.js");
const httpStatus = require('../../core/httpStatus.js');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          httpStatus.FORBIDDEN,
          "You do not have permission to perform this action"
        )
      );
    }
    next();
  };
};

module.exports = authorizeRoles;