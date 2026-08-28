const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, syncUser, changeUserRole } = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/sync', verifyToken, syncUser);
router.get('/:uid', getUserProfile);
router.put('/:uid', verifyToken, updateUserProfile);
router.patch('/:id/role', verifyToken, requireAdmin, changeUserRole);

module.exports = router;
