const router = require('express').Router();
const institutionController = require('../controllers/institutionController');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/current', institutionController.getInstitution);
router.put('/current', requireAdmin, institutionController.updateInstitution);
router.get('/qr-code', requireAdmin, institutionController.getInstitutionQR);
router.get('/rules', institutionController.getAttendanceRules);
router.put('/rules', requireAdmin, institutionController.updateAttendanceRules);

// Super admin only
router.get('/', requireSuperAdmin, institutionController.getAllInstitutions);
router.post('/', requireSuperAdmin, institutionController.createInstitution);
router.post('/:id/repair-code', requireSuperAdmin, institutionController.repairInstitutionCode);

module.exports = router;
