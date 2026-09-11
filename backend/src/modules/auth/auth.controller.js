const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const env = require('../../config/env');
const authService = require('./auth.service');

const REFRESH_COOKIE = 'refreshToken';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const { tokens, user } = await authService.login(email, password);

  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
  success(res, {
    message: 'Inicio de sesión exitoso',
    data: { accessToken: tokens.accessToken, user },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  const { accessToken } = await authService.refresh(token);
  success(res, { message: 'Token renovado', data: { accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  success(res, { message: 'Sesión cerrada' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  success(res, { message: 'Contraseña actualizada correctamente' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  await authService.forgotPassword(email);
  success(res, {
    message:
      'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña',
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.validated.body;
  await authService.resetPassword(token, newPassword);
  success(res, { message: 'Contraseña restablecida correctamente' });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  success(res, { message: 'Usuario autenticado', data: { user } });
});

module.exports = {
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  me,
};
