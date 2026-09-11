const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'storage', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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

module.exports = { createUploader, UPLOAD_DIR, RECEIPT_MIMES, IMAGE_MIMES };
