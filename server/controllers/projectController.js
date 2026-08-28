const svc = require('../services/supabaseService');
const { supabase } = require('../config/supabase');

// ── Helper ─────────────────────────────────────────────────────────────────────
const supabaseReady = () => !!supabase;

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured. Please set SUPABASE_URL and SUPABASE_SECRET_KEY.' });

    const { search, tag, owner, page, limit } = req.query;
    const { data, total, error } = await svc.getProjects({
      search, tag, owner,
      page:  parseInt(page)  || 1,
      limit: Math.min(parseInt(limit) || 9, 20),
    });

    if (error) return next(error);
    const lim = Math.min(parseInt(limit) || 9, 20);
    res.json({ projects: data, total, page: parseInt(page) || 1, totalPages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
};

// GET /api/projects/bookmarks
const getBookmarkedProjects = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });
    const { data, error } = await svc.getBookmarkedProjects(req.user.uid);
    if (error) return next(error);
    res.json({ projects: data });
  } catch (err) { next(err); }
};

// GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { data: project, error } = await svc.getProjectById(req.params.id);
    if (error) return next(error);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Attach evaluation if present
    const { data: evaluation } = await svc.getEvaluationByProjectId(req.params.id);
    if (evaluation) {
      const isTeacherOrAdmin = req.user && (req.user.role === 'teacher' || req.user.role === 'admin');
      if (!isTeacherOrAdmin) delete evaluation.privateNotes;
      project.evaluation = evaluation;
    }

    res.json(project);
  } catch (err) { next(err); }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { title, description, tags, githubUrl, liveDemoUrl } = req.body;
    if (!title || !description || !tags || !githubUrl) {
      return res.status(400).json({ message: 'Title, description, tags, and GitHub URL are required.' });
    }

    const { data, error } = await svc.createProject({
      title, description, tags, githubUrl, liveDemoUrl,
      ownerUid:   req.user?.uid || 'dev-user',
      ownerName:  req.body.ownerName || req.user?.name || 'Anonymous',
      ownerImage: req.body.ownerImage || '',
    });

    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) { next(err); }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { data: existing } = await svc.getProjectById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Project not found.' });
    if (req.user && existing.owner?.firebaseUid !== req.user.uid && existing.owner?.firebaseUid !== 'dev-user') {
      return res.status(403).json({ message: 'Forbidden: you do not own this project.' });
    }

    const { title, description, tags, githubUrl, liveDemoUrl } = req.body;
    const { data, error } = await svc.updateProject(req.params.id, { title, description, tags, githubUrl, liveDemoUrl });
    if (error) return next(error);
    res.json(data);
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { data: existing } = await svc.getProjectById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Project not found.' });
    if (req.user && existing.owner?.firebaseUid !== req.user.uid && existing.owner?.firebaseUid !== 'dev-user') {
      return res.status(403).json({ message: 'Forbidden: you do not own this project.' });
    }

    const { error } = await svc.deleteProject(req.params.id);
    if (error) return next(error);
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/submit-for-evaluation
const submitForEvaluation = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { data: project, error: pErr } = await svc.getProjectById(req.params.id);
    if (pErr || !project) return res.status(404).json({ message: 'Project not found.' });

    const uid = req.user?.uid || 'dev-user';
    if (project.owner?.firebaseUid !== uid && uid !== 'dev-user') {
      return res.status(403).json({ message: 'Forbidden: you can only submit your own project.' });
    }

    const { data: updatedProject, error: uErr } = await svc.submitProjectForEvaluation(req.params.id);
    if (uErr) return next(uErr);

    const { data: evaluation, error: eErr } = await svc.upsertEvaluation({
      projectId:   req.params.id,
      studentUid:  uid,
      status:      'pending',
    });
    if (eErr) return next(eErr);

    res.status(200).json({ message: 'Project submitted for faculty evaluation.', project: updatedProject, evaluation });
  } catch (err) { next(err); }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getBookmarkedProjects,
  submitForEvaluation,
};
