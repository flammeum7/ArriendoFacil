const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../config/constants');
const { createUploader, RECEIPT_MIMES } = require('../../middlewares/upload');
const controller = require('./documents.controller');
const schemas = require('./documents.validation');

const router = Router();
const upload = createUploader({ allowedMimes: RECEIPT_MIMES, maxSizeMb: 5 });

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id/download', validate(schemas.byId), controller.download);

router.post('/', authorize(ROLES.LANDLORD), upload.single('file'), validate(schemas.upload), controller.create);
router.delete('/:id', authorize(ROLES.LANDLORD), validate(schemas.byId), controller.remove);

module.exports = router;
