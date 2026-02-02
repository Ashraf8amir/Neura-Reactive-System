const AppError = require("../../core/appError.js");
const { HTTP_STATUS_TEXT } = require('../constants/enums.js');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          HTTP_STATUS_TEXT.FORBIDDEN,
          "You do not have permission to perform this action"
        )
      );
    }
    next();
  };
};

module.exports = authorizeRoles;