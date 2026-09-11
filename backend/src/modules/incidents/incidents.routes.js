const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../config/constants');
const { createUploader, IMAGE_MIMES } = require('../../middlewares/upload');
const controller = require('./incidents.controller');
const schemas = require('./incidents.validation');

const router = Router();
const uploadImages = createUploader({ allowedMimes: IMAGE_MIMES, maxSizeMb: 3 });

router.use(authenticate);

router.get('/', controller.list);
router.get('/attachments/:id/download', validate(schemas.byId), controller.downloadAttachment);
router.get('/:id', validate(schemas.byId), controller.getById);

// El arrendatario crea incidencias (hasta 3 imágenes)
router.post('/', authorize(ROLES.TENANT), uploadImages.array('attachments', 3), validate(schemas.create), controller.create);

// Ambos roles pueden participar en el hilo (el servicio valida pertenencia; hasta 3 imágenes)
router.post('/:id/responses', uploadImages.array('attachments', 3), validate(schemas.respond), controller.respond);

// El arrendador cambia el estado
router.patch('/:id/status', authorize(ROLES.LANDLORD), validate(schemas.changeStatus), controller.changeStatus);

module.exports = router;
