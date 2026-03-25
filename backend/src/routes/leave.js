const router = require('express').Router();
const leaveController = require('../controllers/leaveController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');

router.use(authenticate);

// Staff routes
router.post('/', leaveController.requestLeave);
router.get('/my', leaveController.getMyLeaves);
router.put('/:id/cancel', leaveController.cancelLeave);

// Admin routes
router.get('/', requireAdmin, leaveController.getAllLeaves);
router.get('/stats', requireAdmin, leaveController.getLeaveStats);
router.put('/:id/review', requireAdmin, auditMiddleware('review_leave', 'leave'), leaveController.reviewLeave);

module.exports = router;
