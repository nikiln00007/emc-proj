const mongoose = require('mongoose');
const Project = require('../models/Project');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/projects/:id/like — toggle like
const toggleLike = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid project ID.' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const uid = req.user.uid;
    const alreadyLiked = project.likedBy.includes(uid);

    if (alreadyLiked) {
      project.likedBy = project.likedBy.filter(id => id !== uid);
      project.likes = Math.max(0, project.likes - 1);
    } else {
      project.likedBy.push(uid);
      project.likes += 1;
    }

    await project.save();
    res.json({ liked: !alreadyLiked, likes: project.likes });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/bookmark — toggle bookmark
const toggleBookmark = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid project ID.' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const uid = req.user.uid;
    const alreadyBookmarked = project.bookmarkedBy.includes(uid);

    if (alreadyBookmarked) {
      project.bookmarkedBy = project.bookmarkedBy.filter(id => id !== uid);
    } else {
      project.bookmarkedBy.push(uid);
    }

    await project.save();
    res.json({ bookmarked: !alreadyBookmarked });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/rating — upsert user rating
const rateProject = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid project ID.' });

    const { value } = req.body;
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const uid = req.user.uid;
    const existingIndex = project.ratings.findIndex(r => r.userId === uid);

    if (existingIndex >= 0) {
      project.ratings[existingIndex].value = value;
    } else {
      project.ratings.push({ userId: uid, value });
    }

    // Recalculate average
    const total = project.ratings.reduce((sum, r) => sum + r.value, 0);
    project.ratingCount = project.ratings.length;
    project.averageRating = parseFloat((total / project.ratingCount).toFixed(1));

    await project.save();
    res.json({
      averageRating: project.averageRating,
      ratingCount: project.ratingCount,
      userRating: value,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { toggleLike, toggleBookmark, rateProject };
