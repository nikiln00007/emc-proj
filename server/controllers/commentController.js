const mongoose = require('mongoose');
const Comment = require('../models/Comment');

const isValidId = (id) => typeof id === 'string' && id.trim().length > 0;

// GET /api/comments/:projectId
const getComments = async (req, res, next) => {
  try {
    if (!req.params.projectId) {
      return res.status(400).json({ message: 'Project ID is required.' });
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

    const comment = await Comment.create({
      projectId,
      userId: req.user?.uid || req.body.userId || 'dev-user',
      userName: req.body.userName || req.user?.name || 'Anonymous Developer',
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
    if (!req.params.id) return res.status(400).json({ message: 'Comment ID is required.' });

    let comment = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      comment = await Comment.findById(req.params.id);
    } else {
      comment = await Comment.findOne({ _id: req.params.id });
    }
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (req.user && comment.userId !== req.user.uid) {
      return res.status(403).json({ message: 'Forbidden: you cannot delete this comment.' });
    }

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Comment.findByIdAndDelete(req.params.id);
    } else {
      await Comment.deleteOne({ _id: req.params.id });
    }
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, createComment, deleteComment };
