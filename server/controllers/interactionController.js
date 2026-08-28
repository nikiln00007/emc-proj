const svc = require('../services/supabaseService');
const { supabase } = require('../config/supabase');

const supabaseReady = () => !!supabase;

// POST /api/projects/:id/like — toggle like
const toggleLike = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });
    const { data, error } = await svc.toggleLike(req.params.id, req.user.uid);
    if (error) return next(error);
    if (!data) return res.status(404).json({ message: 'Project not found.' });
    res.json(data);
  } catch (err) { next(err); }
};

// POST /api/projects/:id/bookmark — toggle bookmark
const toggleBookmark = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });
    const { data, error } = await svc.toggleBookmark(req.params.id, req.user.uid);
    if (error) return next(error);
    if (!data) return res.status(404).json({ message: 'Project not found.' });
    res.json(data);
  } catch (err) { next(err); }
};

// POST /api/projects/:id/rating — upsert user rating
const rateProject = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { value } = req.body;
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const { data, error } = await svc.rateProject(req.params.id, req.user.uid, value);
    if (error) return next(error);
    if (!data) return res.status(404).json({ message: 'Project not found.' });
    res.json(data);
  } catch (err) { next(err); }
};

module.exports = { toggleLike, toggleBookmark, rateProject };
