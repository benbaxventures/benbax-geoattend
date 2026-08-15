const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/forgot-staff-id', authController.forgotStaffId);
router.post('/refresh-token', authenticate, authController.refreshToken);
router.post('/push-token', authenticate, authController.savePushToken);
router.get('/profile', authenticate, authController.getProfile);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
