const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/prisma');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Token de acceso no proporcionado');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (e) {
      throw ApiError.unauthorized('Token de acceso inválido o expirado');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) {
      throw ApiError.unauthorized('Usuario no válido o inactivo');
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
