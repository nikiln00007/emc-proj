const mongoose = require('mongoose');
const Comment = require('../models/Comment');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/comments/:projectId
const getComments = async (req, res, next) => {
  try {
    if (!isValidId(req.params.projectId)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }
    const comments = await Comment.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

// POST /api/comments
const createComment = async (req, res, next) => {
  try {
    const { projectId, text } = req.body;

    if (!projectId || !text || text.trim() === '') {
      return res.status(400).json({ message: 'Project ID and comment text are required.' });
    }

    if (!isValidId(projectId)) return res.status(400).json({ message: 'Invalid project ID.' });

    const comment = await Comment.create({
      projectId,
      userId: req.user.uid,
      userName: req.body.userName || 'Anonymous',
      userImage: req.body.userImage || '',
      text: text.trim(),
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid comment ID.' });

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (comment.userId !== req.user.uid) {
      return res.status(403).json({ message: 'Forbidden: you cannot delete this comment.' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, createComment, deleteComment };
