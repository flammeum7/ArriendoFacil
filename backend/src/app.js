const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Seguridad de cabeceras HTTP
app.use(helmet());

// CORS: origen concreto + credenciales (para la cookie httpOnly del refresh token)
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

// Parseo de cuerpo y cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting general de la API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta más tarde',
    errors: [],
  },
});
app.use('/api', apiLimiter);

// Rutas
app.use('/api', routes);

// 404 + manejo centralizado de errores (siempre al final)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
