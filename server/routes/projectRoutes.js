const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getBookmarkedProjects,
  submitForEvaluation,
} = require('../controllers/projectController');
const { toggleLike, toggleBookmark, rateProject } = require('../controllers/interactionController');
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Optional auth middleware for public routes that want to know requester role
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, (err) => {
      // Ignore auth error for public route
      next();
    });
  }
  next();
};

// Middleware to attach dbUser for project creation owner snapshot
const attachUser = async (req, res, next) => {
  try {
    req.dbUser = await User.findOne({ firebaseUid: req.user.uid });
    next();
  } catch (e) {
    next(e);
  }
};

router.get('/', getProjects);
router.get('/bookmarks', verifyToken, getBookmarkedProjects);
router.get('/:id', optionalAuth, getProjectById);
router.post('/', verifyToken, attachUser, createProject);
router.put('/:id', verifyToken, updateProject);
router.delete('/:id', verifyToken, deleteProject);
router.post('/:id/submit-for-evaluation', verifyToken, submitForEvaluation);

// Interaction routes
router.post('/:id/like', verifyToken, toggleLike);
router.post('/:id/bookmark', verifyToken, toggleBookmark);
router.post('/:id/rating', verifyToken, rateProject);

module.exports = router;
