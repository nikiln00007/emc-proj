const mongoose = require('mongoose');
const Project = require('../models/Project');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Convert numeric 0-10 grade to letter grade
const calculateLetterGrade = (grade) => {
  if (grade === null || grade === undefined || isNaN(grade)) return '';
  const num = Number(grade);
  if (num >= 9.5) return 'A+';
  if (num >= 9.0) return 'A';
  if (num >= 8.5) return 'A-';
  if (num >= 8.0) return 'B+';
  if (num >= 7.5) return 'B';
  if (num >= 7.0) return 'B-';
  if (num >= 6.0) return 'C';
  if (num >= 5.0) return 'D';
  return 'F';
};

// GET /api/teacher/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      pendingCount,
      gradedThisWeek,
      gradedTotal,
      activeStudentsRaw,
      needsAttentionDocs,
      recentActivityDocs,
      gradeStatsAgg,
    ] = await Promise.all([
      Evaluation.countDocuments({ status: { $in: ['pending', 'in_review'] } }),
      Evaluation.countDocuments({ status: 'graded', gradedAt: { $gte: oneWeekAgo } }),
      Evaluation.countDocuments({ status: 'graded' }),
      Evaluation.distinct('studentUid'),
      Evaluation.find({ status: { $in: ['pending', 'in_review', 'needs_revision'] } })
        .sort({ submittedAt: 1 })
        .limit(6)
        .populate('project', 'title tags owner githubUrl liveDemoUrl')
        .populate('student', 'name email profileImage'),
      Evaluation.find({})
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate('project', 'title owner')
        .populate('teacher', 'name profileImage'),
      Evaluation.aggregate([
        { $match: { status: 'graded', grade: { $ne: null } } },
        {
          $group: {
            _id: null,
            avgGrade: { $avg: '$grade' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Grade distribution buckets (A+, A, A-, B+, B, B-, C, D, F)
    const allGraded = await Evaluation.find({ status: 'graded', grade: { $ne: null } }).select('grade letterGrade');
    const distribution = { 'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C': 0, 'D': 0, 'F': 0 };
    allGraded.forEach((e) => {
      const letter = e.letterGrade || calculateLetterGrade(e.grade);
      if (distribution[letter] !== undefined) {
        distribution[letter]++;
      } else {
        distribution['C']++;
      }
    });

    const avgGrade = gradeStatsAgg[0]?.avgGrade ? Number(gradeStatsAgg[0].avgGrade.toFixed(1)) : 0;

    // Format needs attention items with wait time
    const needsAttention = needsAttentionDocs.map((doc) => {
      const waitMs = Date.now() - new Date(doc.submittedAt || doc.createdAt).getTime();
      const waitDays = Math.floor(waitMs / (1000 * 60 * 60 * 24));
      const waitHours = Math.floor(waitMs / (1000 * 60 * 60));
      return {
        ...doc.toObject(),
        waitDays,
        waitHours,
      };
    });

    res.json({
      stats: {
        pendingReviews: pendingCount,
        gradedThisWeek,
        gradedTotal,
        averageGrade: avgGrade,
        activeStudents: activeStudentsRaw.length,
      },
      needsAttention,
      recentActivity: recentActivityDocs,
      gradeDistribution: distribution,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/teacher/pending
const getPendingReviews = async (req, res, next) => {
  try {
    const { status, tag, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['pending', 'in_review', 'needs_revision'] };
    }

    let evaluations = await Evaluation.find(query)
      .sort({ submittedAt: 1 })
      .populate('project')
      .populate('student', 'name email profileImage bio');

    // In-memory filter for search / tag if project is populated
    if (tag && tag !== 'All') {
      const tagLower = tag.toLowerCase();
      evaluations = evaluations.filter((e) =>
        e.project?.tags?.some((t) => t.toLowerCase() === tagLower)
      );
    }

    if (search) {
      const q = search.toLowerCase();
      evaluations = evaluations.filter(
        (e) =>
          e.project?.title?.toLowerCase().includes(q) ||
          e.project?.owner?.name?.toLowerCase().includes(q) ||
          e.student?.name?.toLowerCase().includes(q) ||
          e.student?.email?.toLowerCase().includes(q)
      );
    }

    const formatted = evaluations.map((doc) => {
      const waitMs = Date.now() - new Date(doc.submittedAt || doc.createdAt).getTime();
      const waitDays = Math.floor(waitMs / (1000 * 60 * 60 * 24));
      const waitHours = Math.floor(waitMs / (1000 * 60 * 60));
      return {
        ...doc.toObject(),
        waitDays,
        waitHours,
      };
    });

    res.json({ evaluations: formatted, total: formatted.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/teacher/evaluations
const getAllEvaluations = async (req, res, next) => {
  try {
    const { status, student, tag, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (student) query.studentUid = student;

    let evaluations = await Evaluation.find(query)
      .sort({ updatedAt: -1 })
      .populate('project')
      .populate('student', 'name email profileImage')
      .populate('teacher', 'name profileImage email');

    if (tag && tag !== 'All') {
      const tagLower = tag.toLowerCase();
      evaluations = evaluations.filter((e) =>
        e.project?.tags?.some((t) => t.toLowerCase() === tagLower)
      );
    }

    if (search) {
      const q = search.toLowerCase();
      evaluations = evaluations.filter(
        (e) =>
          e.project?.title?.toLowerCase().includes(q) ||
          e.project?.owner?.name?.toLowerCase().includes(q) ||
          e.student?.name?.toLowerCase().includes(q)
      );
    }

    const total = evaluations.length;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const paginated = evaluations.slice(skip, skip + parseInt(limit));

    res.json({
      evaluations: paginated,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/teacher/evaluations/:id
const getEvaluationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let evaluation = null;

    if (isValidId(id)) {
      evaluation = await Evaluation.findById(id)
        .populate('project')
        .populate('student', 'name email profileImage bio')
        .populate('teacher', 'name email profileImage teacherProfile');

      // If not found by evaluation ID, try looking up by project ID
      if (!evaluation) {
        evaluation = await Evaluation.findOne({ project: id })
          .populate('project')
          .populate('student', 'name email profileImage bio')
          .populate('teacher', 'name email profileImage teacherProfile');
      }

      // If still not found, check if a Project exists with this ID and return a new evaluation skeleton
      if (!evaluation) {
        const project = await Project.findById(id);
        if (project) {
          const student = await User.findOne({ firebaseUid: project.owner?.firebaseUid });
          return res.json({
            _id: project._id,
            project,
            student: student || { name: project.owner?.name, profileImage: project.owner?.profileImage },
            status: project.evaluationStatus || 'in_review',
            grade: null,
            rubric: [],
            feedback: '',
            privateNotes: '',
          });
        }
      }
    }

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation or Project not found.' });
    }

    res.json(evaluation);
  } catch (err) {
    next(err);
  }
};

// POST /api/teacher/evaluations
const createEvaluation = async (req, res, next) => {
  try {
    const { projectId, grade, rubric, feedback, privateNotes, status } = req.body;
    if (!projectId || !isValidId(projectId)) {
      return res.status(400).json({ message: 'Valid projectId is required.' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    let studentUser = await User.findOne({ firebaseUid: project.owner.firebaseUid });
    let teacherUser = req.dbUser || (await User.findOne({ firebaseUid: req.user.uid }));

    const letterGrade = grade !== undefined ? calculateLetterGrade(grade) : '';

    const evaluation = await Evaluation.findOneAndUpdate(
      { project: projectId },
      {
        project: projectId,
        student: studentUser?._id,
        studentUid: project.owner.firebaseUid,
        teacher: teacherUser?._id,
        teacherUid: req.user.uid,
        teacherName: teacherUser?.name || 'Faculty Evaluator',
        status: status || 'in_review',
        grade: grade !== undefined ? Number(grade) : undefined,
        letterGrade,
        rubric: rubric || [],
        feedback: feedback || '',
        privateNotes: privateNotes || '',
        gradedAt: status === 'graded' ? new Date() : undefined,
      },
      { new: true, upsert: true, runValidators: true }
    );

    project.isSubmittedForEvaluation = true;
    project.evaluationStatus = status || 'in_review';
    await project.save();

    res.status(201).json(evaluation);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/teacher/evaluations/:id
const updateEvaluation = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};
    if (isValidId(id)) {
      query = { $or: [{ _id: id }, { project: id }] };
    } else {
      return res.status(400).json({ message: 'Invalid evaluation or project ID.' });
    }

    let evaluation = await Evaluation.findOne(query);
    const { grade, rubric, feedback, privateNotes, status } = req.body;
    const teacherUser = req.dbUser || (await User.findOne({ firebaseUid: req.user.uid }));
    const letterGrade = grade !== undefined ? calculateLetterGrade(grade) : '';

    if (!evaluation) {
      // Check if project exists and auto-create evaluation
      const project = await Project.findById(id);
      if (project) {
        const studentUser = await User.findOne({ firebaseUid: project.owner?.firebaseUid });
        evaluation = await Evaluation.create({
          project: project._id,
          student: studentUser?._id,
          studentUid: project.owner?.firebaseUid,
          teacher: teacherUser?._id,
          teacherUid: req.user.uid,
          teacherName: teacherUser?.name || 'Faculty Evaluator',
          status: status || 'in_review',
          grade: grade !== undefined ? Number(grade) : undefined,
          letterGrade,
          rubric: rubric || [],
          feedback: feedback || '',
          privateNotes: privateNotes || '',
          gradedAt: status === 'graded' ? new Date() : undefined,
        });

        project.isSubmittedForEvaluation = true;
        project.evaluationStatus = status || 'in_review';
        await project.save();

        return res.json(evaluation);
      }
      return res.status(404).json({ message: 'Evaluation record not found.' });
    }

    if (grade !== undefined) {
      evaluation.grade = Number(grade);
      evaluation.letterGrade = calculateLetterGrade(grade);
    }
    if (rubric !== undefined) evaluation.rubric = rubric;
    if (feedback !== undefined) evaluation.feedback = feedback;
    if (privateNotes !== undefined) evaluation.privateNotes = privateNotes;

    if (status) {
      evaluation.status = status;
      if (status === 'graded') {
        evaluation.gradedAt = new Date();
      } else if (status === 'needs_revision') {
        evaluation.revisionRequestedAt = new Date();
      }
    }

    evaluation.teacher = teacherUser?._id;
    evaluation.teacherUid = req.user.uid;
    evaluation.teacherName = teacherUser?.name || 'Faculty Evaluator';

    await evaluation.save();

    // Sync project evaluationStatus
    await Project.findByIdAndUpdate(evaluation.project, {
      evaluationStatus: evaluation.status,
      isSubmittedForEvaluation: true,
    });

    const populated = await Evaluation.findById(evaluation._id)
      .populate('project')
      .populate('student', 'name email profileImage')
      .populate('teacher', 'name email profileImage');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

// GET /api/teacher/gradebook
const getGradebook = async (req, res, next) => {
  try {
    const [students, projects, evaluations] = await Promise.all([
      User.find({ role: 'student' }).select('name email firebaseUid profileImage'),
      Project.find({ isSubmittedForEvaluation: true }).select('title owner evaluationStatus tags createdAt'),
      Evaluation.find({}).populate('project', 'title').populate('teacher', 'name'),
    ]);

    // Build evaluations map: studentUid -> { projectId: evaluation }
    const evalMap = {};
    evaluations.forEach((e) => {
      if (!evalMap[e.studentUid]) evalMap[e.studentUid] = {};
      evalMap[e.studentUid][e.project?._id || e.project] = e;
    });

    // Compute student stats
    const studentRows = students.map((s) => {
      const studentEvals = Object.values(evalMap[s.firebaseUid] || {});
      const graded = studentEvals.filter((e) => e.status === 'graded' && e.grade !== undefined && e.grade !== null);
      const totalScore = graded.reduce((acc, curr) => acc + curr.grade, 0);
      const avgGrade = graded.length > 0 ? Number((totalScore / graded.length).toFixed(1)) : null;

      return {
        student: s,
        submissionsCount: studentEvals.length,
        gradedCount: graded.length,
        averageGrade: avgGrade,
        letterGrade: avgGrade !== null ? calculateLetterGrade(avgGrade) : '—',
        evaluations: evalMap[s.firebaseUid] || {},
      };
    });

    res.json({
      students: studentRows,
      projects,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/teacher/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const [allEvaluations, allProjects, allStudents] = await Promise.all([
      Evaluation.find({}).populate('project', 'tags title').populate('teacher', 'name email'),
      Project.find({}).select('title tags owner isSubmittedForEvaluation evaluationStatus createdAt'),
      User.find({ role: 'student' }).select('name email firebaseUid profileImage createdAt'),
    ]);

    // 1. Tag breakdown: avg grade and submission count per tech tag
    const tagMap = {};
    allEvaluations.forEach((ev) => {
      const tags = ev.project?.tags || [];
      tags.forEach((t) => {
        if (!tagMap[t]) tagMap[t] = { count: 0, totalGrade: 0, gradedCount: 0 };
        tagMap[t].count++;
        if (ev.status === 'graded' && ev.grade !== undefined && ev.grade !== null) {
          tagMap[t].totalGrade += ev.grade;
          tagMap[t].gradedCount++;
        }
      });
    });

    const tagAnalytics = Object.entries(tagMap).map(([tag, data]) => ({
      tag,
      submissions: data.count,
      averageGrade: data.gradedCount > 0 ? Number((data.totalGrade / data.gradedCount).toFixed(1)) : 0,
      letterGrade: data.gradedCount > 0 ? calculateLetterGrade(data.totalGrade / data.gradedCount) : '—',
    })).sort((a, b) => b.submissions - a.submissions);

    // 2. Students with zero submissions
    const submittedStudentUids = new Set(allEvaluations.map((e) => e.studentUid));
    const zeroSubmissionStudents = allStudents.filter((s) => !submittedStudentUids.has(s.firebaseUid));

    // 3. Teacher Workload
    const teacherWorkloadMap = {};
    allEvaluations.forEach((ev) => {
      if (ev.teacherName || ev.teacher?.name) {
        const name = ev.teacher?.name || ev.teacherName || 'Faculty Judge';
        if (!teacherWorkloadMap[name]) {
          teacherWorkloadMap[name] = { name, completedReviews: 0, inReviewCount: 0 };
        }
        if (ev.status === 'graded') teacherWorkloadMap[name].completedReviews++;
        if (ev.status === 'in_review') teacherWorkloadMap[name].inReviewCount++;
      }
    });

    // 4. Submissions over time (last 7 intervals/days)
    const submissionsByDate = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      submissionsByDate[label] = 0;
    }

    allEvaluations.forEach((ev) => {
      const d = new Date(ev.submittedAt || ev.createdAt);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      if (submissionsByDate[label] !== undefined) {
        submissionsByDate[label]++;
      }
    });

    res.json({
      tagAnalytics,
      zeroSubmissionStudents,
      teacherWorkload: Object.values(teacherWorkloadMap),
      timeline: Object.entries(submissionsByDate).map(([date, count]) => ({ date, count })),
      summary: {
        totalEvaluations: allEvaluations.length,
        totalProjects: allProjects.length,
        totalStudents: allStudents.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/teacher/students
const getStudentsList = async (req, res, next) => {
  try {
    const [students, projects, evaluations] = await Promise.all([
      User.find({ role: 'student' }).select('name email firebaseUid profileImage bio createdAt'),
      Project.find({}).select('owner isSubmittedForEvaluation evaluationStatus'),
      Evaluation.find({ status: 'graded', grade: { $ne: null } }).select('studentUid grade'),
    ]);

    const result = students.map((s) => {
      const userProjects = projects.filter((p) => p.owner.firebaseUid === s.firebaseUid);
      const userEvals = evaluations.filter((e) => e.studentUid === s.firebaseUid);
      const avgGrade =
        userEvals.length > 0
          ? Number((userEvals.reduce((acc, c) => acc + c.grade, 0) / userEvals.length).toFixed(1))
          : null;

      return {
        ...s.toObject(),
        projectsCount: userProjects.length,
        submittedCount: userProjects.filter((p) => p.isSubmittedForEvaluation).length,
        gradedCount: userEvals.length,
        averageGrade: avgGrade,
        letterGrade: avgGrade !== null ? calculateLetterGrade(avgGrade) : '—',
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ADMIN: POST /api/teacher/invite
const createTeacherInvite = async (req, res, next) => {
  try {
    const { email, department, subjects } = req.body;
    const inviteCode = 'TEACH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // If an existing user matches this email, we can also upgrade them directly
    let updatedUser = null;
    if (email) {
      updatedUser = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          role: 'teacher',
          'teacherProfile.department': department || 'Computer Science',
          'teacherProfile.subjects': subjects || ['Web Development'],
          'teacherProfile.canGrade': true,
        },
        { new: true }
      );
    }

    res.status(201).json({
      inviteCode,
      message: updatedUser
        ? `User ${email} has been granted Teacher privileges.`
        : `Teacher invite code created: ${inviteCode}`,
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

// ADMIN: PATCH /api/teacher/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, department, subjects, canGrade } = req.body;

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    let user = null;
    if (isValidId(id)) {
      user = await User.findById(id);
    } else {
      user = await User.findOne({ firebaseUid: id });
    }

    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.role = role;
    if (role === 'teacher' || role === 'admin') {
      user.teacherProfile = {
        department: department || user.teacherProfile?.department || 'Computer Science',
        subjects: subjects || user.teacherProfile?.subjects || ['Full-Stack Engineering'],
        canGrade: canGrade !== undefined ? canGrade : true,
      };
    }

    await user.save();
    res.json({ message: `Role updated to ${role} for ${user.name}`, user });
  } catch (err) {
    next(err);
  }
};

// ADMIN: GET /api/teacher/admin/teachers
const getTeachersList = async (req, res, next) => {
  try {
    const teachers = await User.find({ role: { $in: ['teacher', 'admin'] } }).sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  calculateLetterGrade,
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
};
