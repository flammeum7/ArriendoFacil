const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Contraseña temporal de 10 caracteres con mayúscula, minúscula, dígito y símbolo
function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%&*';
  const all = upper + lower + digits + symbols;
  const pick = (set) => set[crypto.randomInt(set.length)];

  let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
  for (let i = 0; i < 6; i += 1) pwd += pick(all);

  return pwd
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
}

// Token seguro: devuelve el token en claro (para el enlace) y su hash (para la BD)
function generateSecureToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashPassword,
  comparePassword,
  generateTempPassword,
  generateSecureToken,
  hashToken,
};
