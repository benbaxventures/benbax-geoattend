const router = require('express').Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { requireActiveSubscription } = require('../middleware/subscription');

router.use(authenticate, requireActiveSubscription);

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/my-attendance', attendanceController.getMyAttendance);
router.get('/today', attendanceController.getTodayStatus);
router.get('/weekly-stats', attendanceController.getWeeklyStats);

module.exports = router;
