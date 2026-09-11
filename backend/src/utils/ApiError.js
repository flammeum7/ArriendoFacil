class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Solicitud inválida', errors = []) {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = 'No autenticado') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'No autorizado para esta acción') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }
  static conflict(message = 'Conflicto con el estado actual', errors = []) {
    return new ApiError(409, message, errors);
  }
}

module.exports = ApiError;
