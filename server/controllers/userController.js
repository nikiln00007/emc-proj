const User = require('../models/User');

// POST /api/users/sync — called after Firebase signup/login
const syncUser = async (req, res, next) => {
  try {
    const { uid, email } = req.user;
    const { name, profileImage, role } = req.body;

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        name: name || email?.split('@')[0] || 'Developer',
        email: email || `${uid}@peerhub.local`,
        profileImage: profileImage || '',
        role: role && ['student', 'teacher', 'admin'].includes(role) ? role : 'student',
      });
    } else if (role && ['student', 'teacher', 'admin'].includes(role) && user.role !== role) {
      // In dev or requested role update
      user.role = role;
      await user.save();
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:uid
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.uid });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:uid
const updateUserProfile = async (req, res, next) => {
  try {
    if (req.user.uid !== req.params.uid) {
      return res.status(403).json({ message: 'Forbidden: cannot edit another user\'s profile.' });
    }

    const { name, bio, profileImage } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.params.uid },
      { name, bio, profileImage },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/role
const changeUserRole = async (req, res, next) => {
  try {
    const { role, department, subjects, canGrade } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const query = req.params.id.length === 24 ? { _id: req.params.id } : { firebaseUid: req.params.id };
    const user = await User.findOne(query);
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
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { syncUser, getUserProfile, updateUserProfile, changeUserRole };
