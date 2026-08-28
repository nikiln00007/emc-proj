const express = require('express');
const router = express.Router();
const { getComments, createComment, deleteComment } = require('../controllers/commentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:projectId', getComments);
router.post('/', verifyToken, createComment);
router.delete('/:id', verifyToken, deleteComment);

module.exports = router;
