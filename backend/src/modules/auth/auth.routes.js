const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const controller = require('./auth.controller');
const schemas = require('./auth.validation');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos, espera unos minutos',
    errors: [],
  },
});

router.post('/login', authLimiter, validate(schemas.login), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), controller.resetPassword);
router.post('/change-password', authenticate, validate(schemas.changePassword), controller.changePassword);
router.get('/me', authenticate, controller.me);

module.exports = router;
