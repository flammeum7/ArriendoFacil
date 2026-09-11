const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../config/constants');
const { createUploader, RECEIPT_MIMES } = require('../../middlewares/upload');
const controller = require('./payments.controller');
const schemas = require('./payments.validation');

const router = Router();
const uploadReceipt = createUploader({ allowedMimes: RECEIPT_MIMES, maxSizeMb: 5 });

router.use(authenticate);

// Consulta (arrendador: todo; arrendatario: solo lo suyo, filtrado en el servicio)
router.get('/', controller.list);

// Acciones del arrendador (rutas específicas antes que /:id dinámicas del mismo verbo)
router.post('/generate', authorize(ROLES.LANDLORD), controller.generate);
router.post('/mark-overdue', authorize(ROLES.LANDLORD), controller.markOverdue);

router.get('/:id', validate(schemas.byId), controller.getById);

// Arrendatario: cargar comprobante (multipart/form-data, campo "receipt")
router.post(
  '/:id/receipt',
  authorize(ROLES.TENANT),
  uploadReceipt.single('receipt'),
  validate(schemas.uploadReceipt),
  controller.uploadReceipt
);

// Arrendador: aprobar / rechazar
router.post('/:id/approve', authorize(ROLES.LANDLORD), validate(schemas.byId), controller.approve);
router.post('/:id/reject', authorize(ROLES.LANDLORD), validate(schemas.reject), controller.reject);

module.exports = router;
