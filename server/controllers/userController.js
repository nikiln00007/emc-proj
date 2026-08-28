const svc = require('../services/supabaseService');
const { supabase } = require('../config/supabase');

const supabaseReady = () => !!supabase;

// POST /api/users/sync — called after Firebase signup/login
const syncUser = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { uid, email } = req.user;
    const { name, profileImage, role } = req.body;

    const { data, error } = await svc.upsertUser({
      firebaseUid:  uid,
      email,
      name:         name || email?.split('@')[0] || 'Developer',
      profileImage: profileImage || '',
      role:         role && ['student', 'teacher', 'admin'].includes(role) ? role : 'student',
    });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (err) { next(err); }
};

// GET /api/users/:uid
const getUserProfile = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { data, error } = await svc.getUserByUid(req.params.uid);
    if (error) return next(error);
    if (!data) return res.status(404).json({ message: 'User not found.' });
    res.json(data);
  } catch (err) { next(err); }
};

// PUT /api/users/:uid
const updateUserProfile = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });
    if (req.user.uid !== req.params.uid) {
      return res.status(403).json({ message: "Forbidden: cannot edit another user's profile." });
    }

    const { name, bio, profileImage } = req.body;
    const { data, error } = await svc.updateUser(req.params.uid, { name, bio, profileImage });
    if (error) return next(error);
    if (!data) return res.status(404).json({ message: 'User not found.' });
    res.json(data);
  } catch (err) { next(err); }
};

// PATCH /api/users/:id/role
const changeUserRole = async (req, res, next) => {
  try {
    if (!supabaseReady()) return res.status(503).json({ message: 'Database not configured.' });

    const { role, department, subjects, canGrade } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const { data, error } = await svc.updateUser(req.params.id, {
      role,
      department: department || 'Computer Science',
      subjects:   subjects  || ['Full-Stack Engineering'],
      canGrade:   canGrade !== undefined ? canGrade : true,
    });

    if (error) return next(error);
    if (!data) return res.status(404).json({ message: 'User not found.' });
    res.json(data);
  } catch (err) { next(err); }
};

module.exports = { syncUser, getUserProfile, updateUserProfile, changeUserRole };
