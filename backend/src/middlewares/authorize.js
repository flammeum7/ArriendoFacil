const ApiError = require('../utils/ApiError');

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('No tienes permiso para esta acción'));
    }
    next();
  };
}

module.exports = authorize;
