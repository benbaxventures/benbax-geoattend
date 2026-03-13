const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/attendance', reportController.getAttendanceReport);
router.get('/realtime', reportController.getRealTimeAttendance);
router.get('/weekly-summary', reportController.getWeeklySummary);
router.get('/export/excel', reportController.exportExcel);
router.get('/export/pdf', reportController.exportPDF);

module.exports = router;
