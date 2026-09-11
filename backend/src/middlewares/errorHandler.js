const multer = require('multer');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errors = err.errors || [];

  // Errores de subida de archivos (multer)
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'El archivo excede el tamaño permitido';
    } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Cantidad de archivos no permitida';
    } else {
      message = 'Error al subir el archivo';
    }
  }

  // Errores conocidos de Prisma
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Ya existe un registro con un valor único duplicado';
    errors = err.meta?.target
      ? [{ field: String(err.meta.target), message: 'Valor duplicado' }]
      : [];
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Registro no encontrado';
  }

  if (statusCode === 500) {
    console.error('[ERROR]', err);
  }

  const body = { success: false, message, errors };
  if (env.nodeEnv === 'development' && statusCode === 500) {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
