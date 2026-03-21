const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/refresh-token', authenticate, authController.refreshToken);
router.get('/profile', authenticate, authController.getProfile);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
