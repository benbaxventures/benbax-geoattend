const router = require('express').Router();
const geofenceController = require('../controllers/geofenceController');
const { authenticate } = require('../middleware/auth');
const { requireActiveSubscription } = require('../middleware/subscription');

router.use(authenticate, requireActiveSubscription);

router.post('/event', geofenceController.recordEvent);

module.exports = router;

