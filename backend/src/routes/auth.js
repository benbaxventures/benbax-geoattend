const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/refresh-token', authenticate, authController.refreshToken);
router.post('/push-token', authenticate, authController.savePushToken);
router.get('/profile', authenticate, authController.getProfile);
router.put('/change-password', authenticate, authController.changePassword);

// Super-admin helper: create initial admin for an institution
router.post('/create-initial-admin', authenticate, requireSuperAdmin, authController.createInitialAdmin);

module.exports = router;
