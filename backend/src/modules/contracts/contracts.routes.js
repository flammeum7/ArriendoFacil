const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../config/constants');
const controller = require('./contracts.controller');
const schemas = require('./contracts.validation');

const router = Router();

router.use(authenticate, authorize(ROLES.LANDLORD));

router.get('/', controller.list);
router.post('/', validate(schemas.create), controller.create);
router.get('/:id', validate(schemas.byId), controller.getById);
router.post('/:id/renew', validate(schemas.renew), controller.renew);
router.patch('/:id/cancel', validate(schemas.byId), controller.cancel);

module.exports = router;
