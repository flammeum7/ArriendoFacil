const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
} = require('../../utils/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../../utils/jwt');
const { sendPasswordResetEmail } = require('../../utils/mailService');

function buildTokens(user) {
  const payload = { sub: user.id, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Mensaje genérico: no revelamos si el email existe o no
  if (!user || !user.active) {
    throw ApiError.unauthorized('Credenciales inválidas');
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    throw ApiError.unauthorized('Credenciales inválidas');
  }

  // Contraseña temporal expirada (72 h)
  if (
    user.mustChangePassword &&
    user.tempPasswordExpiresAt &&
    user.tempPasswordExpiresAt < new Date()
  ) {
    throw ApiError.unauthorized(
      'Tu contraseña temporal ha expirado. Solicita una nueva al administrador.'
    );
  }

  const tokens = buildTokens(user);
  return {
    tokens,
    user: {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token no proporcionado');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    throw ApiError.unauthorized('Refresh token inválido o expirado');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) throw ApiError.unauthorized('Usuario no válido');

  return { accessToken: signAccessToken({ sub: user.id, role: user.role }) };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Usuario no encontrado');

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest('La contraseña actual no es correcta');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
      tempPasswordExpiresAt: null,
    },
  });
  return true;
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Anti-enumeración: siempre respondemos igual, solo actuamos si existe
  if (user && user.active) {
    const { token, hash } = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash: hash, passwordResetExpiresAt: expires },
    });
    await sendPasswordResetEmail(user.email, token);
  }
  return true;
}

async function resetPassword(token, newPassword) {
  const hash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hash,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) throw ApiError.badRequest('Token inválido o expirado');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      mustChangePassword: false,
      tempPasswordExpiresAt: null,
    },
  });
  return true;
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    dni: user.dni,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
  };
}

module.exports = {
  login,
  refresh,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
