const svc = require('../services/supabaseService');
const { supabase } = require('../config/supabase');

const supabaseReady = () => !!supabase;

// GET /api/comments/:projectId
const getComments = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { data, error } = await svc.getCommentsByProjectId(req.params.projectId);
    if (error) return next(error);
    res.json(data);
  } catch (err) { next(err); }
};

// POST /api/comments
const createComment = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { projectId, text, userName, userImage } = req.body;
    if (!projectId || !text?.trim()) {
      return res.status(400).json({ message: 'projectId and text are required.' });
    }

    const { data, error } = await svc.createComment({
      projectId,
      userId:    req.user?.uid || 'dev-user',
      userName:  userName || req.user?.name || 'Anonymous Developer',
      userImage: userImage || '',
      text:      text.trim(),
    });

    if (error) return next(error);
    res.status(201).json(data);
  } catch (err) { next(err); }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { error } = await svc.deleteComment(req.params.id, req.user?.uid);
    if (error) {
      if (error.status === 404) return res.status(404).json({ message: error.message });
      if (error.status === 403) return res.status(403).json({ message: error.message });
      return next(error);
    }
    res.json({ message: 'Comment deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getComments, createComment, deleteComment };
