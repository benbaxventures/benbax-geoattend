const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { requireActiveSubscription } = require('../middleware/subscription');

router.use(authenticate, requireActiveSubscription, requireAdmin);

router.get('/trends', analyticsController.getAttendanceTrends);
router.get('/top-absentees', analyticsController.getTopAbsentees);
router.get('/departments', analyticsController.getDepartmentStats);
router.get('/overtime', analyticsController.getOvertimeSummary);
router.get('/audit-logs', analyticsController.getAuditLogs);
router.get('/scheduler', analyticsController.getSchedulerStatus);

module.exports = router;
