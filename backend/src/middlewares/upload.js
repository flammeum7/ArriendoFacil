const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'storage', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// HM-07: multer (busboy) lee el nombre del archivo como latin1, pero los navegadores lo
// envían en UTF-8 ("Introducción" llegaba como "IntroducciÃ³n"). Se reinterpreta como UTF-8
// solo si el resultado es válido, para no dañar nombres que ya llegan bien.
function corregirNombreUtf8(nombre) {
  if (!nombre || !/[\u0080-ÿ]/.test(nombre) || /[^\u0000-ÿ]/.test(nombre)) return nombre;
  const utf8 = Buffer.from(nombre, 'latin1').toString('utf8');
  return utf8.includes('�') ? nombre : utf8;
}

function createUploader({ allowedMimes, maxSizeMb }) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    file.originalname = corregirNombreUtf8(file.originalname);
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
  });
}

const RECEIPT_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
const IMAGE_MIMES = ['image/jpeg', 'image/png'];

module.exports = { createUploader, corregirNombreUtf8, UPLOAD_DIR, RECEIPT_MIMES, IMAGE_MIMES };
