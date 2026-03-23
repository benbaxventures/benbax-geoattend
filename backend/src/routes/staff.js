const router = require('express').Router();
const staffController = require('../controllers/staffController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/', staffController.getAllStaff);
router.get('/departments', staffController.getDepartments);
router.get('/:id', staffController.getStaffById);
router.post('/', staffController.createStaff);
router.post('/bulk-import', staffController.bulkImport);
router.put('/:id', staffController.updateStaff);
router.put('/:id/reset-password', staffController.resetPassword);
router.get('/:id/qr-code', staffController.getStaffQRCode);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
