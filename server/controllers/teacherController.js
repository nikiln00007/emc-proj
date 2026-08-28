const svc = require('../services/supabaseService');
const { supabase } = require('../config/supabase');

const supabaseReady = () => !!supabase;

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
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: allEvals } = await supabase.from('evaluations').select('*');
    const evals = allEvals || [];

    const pendingCount = evals.filter(e => ['pending', 'in_review'].includes(e.status)).length;
    const gradedTotal  = evals.filter(e => e.status === 'graded').length;
    const gradedThisWeek = evals.filter(e => e.status === 'graded' && e.graded_at >= oneWeekAgo).length;
    const activeStudentUids = [...new Set(evals.map(e => e.student_uid).filter(Boolean))];

    const gradedWithGrade = evals.filter(e => e.status === 'graded' && e.grade != null);
    const avgGrade = gradedWithGrade.length > 0
      ? Number((gradedWithGrade.reduce((s, e) => s + Number(e.grade), 0) / gradedWithGrade.length).toFixed(1))
      : 0;

    // Grade distribution
    const distribution = { 'A+': 0, A: 0, 'A-': 0, 'B+': 0, B: 0, 'B-': 0, C: 0, D: 0, F: 0 };
    gradedWithGrade.forEach(e => {
      const letter = e.letter_grade || calculateLetterGrade(e.grade);
      if (distribution[letter] !== undefined) distribution[letter]++;
      else distribution['C']++;
    });

    // Needs attention (with project info)
    const needsAttentionRaw = evals.filter(e => ['pending', 'in_review', 'needs_revision'].includes(e.status))
      .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
      .slice(0, 6);

    const projectIds = [...new Set(needsAttentionRaw.map(e => e.project_id))];
    const { data: projData } = await supabase.from('projects').select('*').in('id', projectIds);
    const projMap = Object.fromEntries((projData || []).map(p => [p.id, p]));

    const needsAttention = needsAttentionRaw.map(e => {
      const waitMs   = Date.now() - new Date(e.submitted_at || e.created_at).getTime();
      const project  = projMap[e.project_id] || null;
      return { ...e, project, waitDays: Math.floor(waitMs / 86400000), waitHours: Math.floor(waitMs / 3600000) };
    });

    res.json({
      stats: { pendingReviews: pendingCount, gradedThisWeek, gradedTotal, averageGrade: avgGrade, activeStudents: activeStudentUids.length },
      needsAttention,
      recentActivity: evals.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 8),
      gradeDistribution: distribution,
    });
  } catch (err) { next(err); }
};

// GET /api/teacher/pending
const getPendingReviews = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { status, tag, search } = req.query;
    const { data: evaluations, error } = await svc.getPendingEvaluations({ status });
    if (error) return next(error);

    // Fetch projects for filtering
    const projectIds = [...new Set(evaluations.map(e => e.projectId).filter(Boolean))];
    let projects = [];
    if (projectIds.length > 0) {
      const { data } = await supabase.from('projects').select('*').in('id', projectIds);
      projects = data || [];
    }
    const projMap = Object.fromEntries(projects.map(p => [p.id, p]));

    let filtered = evaluations.map(e => ({
      ...e,
      project: projMap[e.projectId] || null,
    }));

    if (tag && tag !== 'All') {
      filtered = filtered.filter(e => e.project?.tags?.some(t => t.toLowerCase() === tag.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.project?.title?.toLowerCase().includes(q) ||
        e.project?.owner_name?.toLowerCase().includes(q)
      );
    }

    const formatted = filtered.map(e => {
      const waitMs = Date.now() - new Date(e.submittedAt || e.createdAt).getTime();
      return { ...e, waitDays: Math.floor(waitMs / 86400000), waitHours: Math.floor(waitMs / 3600000) };
    });

    res.json({ evaluations: formatted, total: formatted.length });
  } catch (err) { next(err); }
};

// GET /api/teacher/evaluations
const getAllEvaluations = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { status, student, tag, search, page = 1, limit = 20 } = req.query;
    const { data, total, error } = await svc.getAllEvaluations({
      status, studentUid: student,
      page: parseInt(page), limit: parseInt(limit),
    });
    if (error) return next(error);
    res.json({ evaluations: data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// GET /api/teacher/evaluations/:id
const getEvaluationById = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { id } = req.params;
    // Try as evaluation id, then as project id
    let { data: evaluation } = await svc.getEvaluationById(id);
    if (!evaluation) {
      ({ data: evaluation } = await svc.getEvaluationByProjectId(id));
    }

    if (!evaluation) {
      // Return skeleton for teacher to start evaluation from project id
      const { data: project } = await svc.getProjectById(id);
      if (project) {
        return res.json({
          _id: project.id, id: project.id, project,
          status: project.evaluationStatus || 'in_review',
          grade: null, rubric: [], feedback: '', privateNotes: '',
        });
      }
      return res.status(404).json({ message: 'Evaluation or Project not found.' });
    }

    // Attach project
    const { data: project } = await svc.getProjectById(evaluation.projectId);
    if (project) evaluation.project = project;

    res.json(evaluation);
  } catch (err) { next(err); }
};

// POST /api/teacher/evaluations
const createEvaluation = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { projectId, grade, rubric, feedback, privateNotes, status } = req.body;
    if (!projectId) return res.status(400).json({ message: 'projectId is required.' });

    const { data: project } = await svc.getProjectById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const letterGrade = grade !== undefined ? calculateLetterGrade(grade) : '';
    const teacherName = req.body.teacherName || req.user?.name || 'Faculty Evaluator';

    const { data: evaluation, error } = await svc.upsertEvaluation({
      projectId,
      studentUid:  project.owner?.firebaseUid || project.ownerUid,
      teacherUid:  req.user?.uid,
      teacherName,
      status:      status || 'in_review',
      grade, letterGrade, rubric, feedback, privateNotes,
    });
    if (error) return next(error);

    await svc.updateProjectEvaluationStatus(projectId, status || 'in_review');
    evaluation.project = project;

    res.status(201).json(evaluation);
  } catch (err) { next(err); }
};

// PATCH /api/teacher/evaluations/:id
const updateEvaluation = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { id } = req.params;
    const { grade, rubric, feedback, privateNotes, status } = req.body;

    // Find the evaluation by id or by project id
    let { data: existing } = await svc.getEvaluationById(id);
    if (!existing) ({ data: existing } = await svc.getEvaluationByProjectId(id));

    let projectId = existing?.projectId || id;
    const letterGrade = grade !== undefined ? calculateLetterGrade(grade) : (existing?.letterGrade || '');
    const teacherName = req.user?.name || existing?.teacherName || 'Faculty Evaluator';

    const { data: evaluation, error } = await svc.upsertEvaluation({
      projectId,
      studentUid:  existing?.studentUid || '',
      teacherUid:  req.user?.uid,
      teacherName,
      status:      status || existing?.status || 'in_review',
      grade:       grade !== undefined ? grade : existing?.grade,
      letterGrade,
      rubric:      rubric  !== undefined ? rubric      : existing?.rubric,
      feedback:    feedback !== undefined ? feedback   : existing?.feedback,
      privateNotes: privateNotes !== undefined ? privateNotes : existing?.privateNotes,
    });
    if (error) return next(error);

    await svc.updateProjectEvaluationStatus(projectId, status || existing?.status || 'in_review');

    const { data: project } = await svc.getProjectById(projectId);
    if (project) evaluation.project = project;

    res.json(evaluation);
  } catch (err) { next(err); }
};

// GET /api/teacher/gradebook
const getGradebook = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { students, projects, evaluations, error } = await svc.getGradebook();
    if (error) return next(error);

    const evalMap = {};
    evaluations.forEach(e => {
      if (!evalMap[e.studentUid]) evalMap[e.studentUid] = {};
      evalMap[e.studentUid][e.projectId] = e;
    });

    const studentRows = students.map(s => {
      const studentEvals = Object.values(evalMap[s.firebaseUid] || {});
      const graded = studentEvals.filter(e => e.status === 'graded' && e.grade != null);
      const avgGrade = graded.length > 0 ? Number((graded.reduce((a, c) => a + Number(c.grade), 0) / graded.length).toFixed(1)) : null;
      return {
        student: s,
        submissionsCount: studentEvals.length,
        gradedCount: graded.length,
        averageGrade: avgGrade,
        letterGrade: avgGrade !== null ? calculateLetterGrade(avgGrade) : '—',
        evaluations: evalMap[s.firebaseUid] || {},
      };
    });

    res.json({ students: studentRows, projects });
  } catch (err) { next(err); }
};

// GET /api/teacher/analytics
const getAnalytics = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { evaluations, projects, students, error } = await svc.getAnalyticsData();
    if (error) return next(error);

    // Tag analytics
    const tagMap = {};
    evaluations.forEach(ev => {
      const proj = projects.find(p => p.id === (ev.projectId || ev.project_id));
      (proj?.tags || []).forEach(t => {
        if (!tagMap[t]) tagMap[t] = { count: 0, totalGrade: 0, gradedCount: 0 };
        tagMap[t].count++;
        if (ev.status === 'graded' && ev.grade != null) {
          tagMap[t].totalGrade += Number(ev.grade);
          tagMap[t].gradedCount++;
        }
      });
    });
    const tagAnalytics = Object.entries(tagMap).map(([tag, d]) => ({
      tag,
      submissions: d.count,
      averageGrade: d.gradedCount > 0 ? Number((d.totalGrade / d.gradedCount).toFixed(1)) : 0,
      letterGrade: d.gradedCount > 0 ? calculateLetterGrade(d.totalGrade / d.gradedCount) : '—',
    })).sort((a, b) => b.submissions - a.submissions);

    const submittedUids = new Set(evaluations.map(e => e.studentUid).filter(Boolean));
    const zeroSubmissionStudents = students.filter(s => !submittedUids.has(s.firebaseUid));

    const submissionsByDate = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      submissionsByDate[label] = 0;
    }
    evaluations.forEach(ev => {
      const d = new Date(ev.submittedAt || ev.createdAt);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      if (submissionsByDate[label] !== undefined) submissionsByDate[label]++;
    });

    res.json({
      tagAnalytics,
      zeroSubmissionStudents,
      teacherWorkload: [],
      timeline: Object.entries(submissionsByDate).map(([date, count]) => ({ date, count })),
      summary: { totalEvaluations: evaluations.length, totalProjects: projects.length, totalStudents: students.length },
    });
  } catch (err) { next(err); }
};

// GET /api/teacher/students
const getStudentsList = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { students, projects, evaluations } = await svc.getGradebook();
    const result = students.map(s => {
      const userProjects = projects.filter(p => p.ownerUid === s.firebaseUid);
      const userEvals    = evaluations.filter(e => e.studentUid === s.firebaseUid && e.status === 'graded' && e.grade != null);
      const avgGrade     = userEvals.length > 0 ? Number((userEvals.reduce((a, c) => a + Number(c.grade), 0) / userEvals.length).toFixed(1)) : null;
      return {
        ...s,
        projectsCount:  userProjects.length,
        submittedCount: userProjects.filter(p => p.isSubmittedForEvaluation).length,
        gradedCount:    userEvals.length,
        averageGrade:   avgGrade,
        letterGrade:    avgGrade !== null ? calculateLetterGrade(avgGrade) : '—',
      };
    });
    res.json(result);
  } catch (err) { next(err); }
};

// ADMIN: POST /api/teacher/invite
const createTeacherInvite = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { email, department, subjects } = req.body;
    const inviteCode = 'TEACH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    let updatedUser = null;
    if (email) {
      const { data: found } = await supabase.from('users').select('firebase_uid').ilike('email', email).maybeSingle();
      if (found) {
        const { data } = await svc.updateUser(found.firebase_uid, { role: 'teacher', department, subjects: subjects || ['Web Development'], canGrade: true });
        updatedUser = data;
      }
    }

    res.status(201).json({
      inviteCode,
      message: updatedUser ? `User ${email} has been granted Teacher privileges.` : `Teacher invite code created: ${inviteCode}`,
      user: updatedUser,
    });
  } catch (err) { next(err); }
};

// ADMIN: PATCH /api/teacher/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { role, department, subjects, canGrade } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });

    const { data, error } = await svc.updateUser(req.params.id, { role, department, subjects, canGrade });
    if (error) return next(error);
    if (!data) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: `Role updated to ${role} for ${data.name}`, user: data });
  } catch (err) { next(err); }
};

// ADMIN: GET /api/teacher/admin/teachers
const getTeachersList = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });
    const { data, error } = await svc.getAllTeachers();
    if (error) return next(error);
    res.json(data);
  } catch (err) { next(err); }
};

module.exports = {
  calculateLetterGrade,
  getDashboardStats, getPendingReviews, getAllEvaluations, getEvaluationById,
  createEvaluation, updateEvaluation, getGradebook, getAnalytics,
  getStudentsList, createTeacherInvite, updateUserRole, getTeachersList,
};
