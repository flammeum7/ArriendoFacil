const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../config/constants');
const controller = require('./services.controller');
const schemas = require('./services.validation');

const router = Router();

router.use(authenticate);

// Consulta: ambos roles (arrendatario solo lo suyo, filtrado en el servicio)
router.get('/', controller.list);
router.get('/:id', validate(schemas.byId), controller.getById);

// Registro/edición: solo arrendador
router.post('/', authorize(ROLES.LANDLORD), validate(schemas.create), controller.create);
router.put('/:id', authorize(ROLES.LANDLORD), validate(schemas.update), controller.update);

module.exports = router;
