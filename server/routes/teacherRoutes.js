const express = require('express');
const router = express.Router();
const { verifyToken, requireTeacher, requireAdmin } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getPendingReviews,
  getAllEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  getGradebook,
  getAnalytics,
  getStudentsList,
  createTeacherInvite,
  updateUserRole,
  getTeachersList,
} = require('../controllers/teacherController');

// All teacher routes require authentication + teacher or admin role
router.use(verifyToken, requireTeacher);

// Dashboard & queues
router.get('/dashboard', getDashboardStats);
router.get('/pending', getPendingReviews);
router.get('/evaluations', getAllEvaluations);
router.get('/evaluations/:id', getEvaluationById);
router.post('/evaluations', createEvaluation);
router.patch('/evaluations/:id', updateEvaluation);

// Gradebook, analytics & students
router.get('/gradebook', getGradebook);
router.get('/analytics', getAnalytics);
router.get('/students', getStudentsList);

// Admin-only endpoints
router.post('/invite', requireAdmin, createTeacherInvite);
router.patch('/users/:id/role', requireAdmin, updateUserRole);
router.get('/admin/teachers', requireAdmin, getTeachersList);

module.exports = router;
