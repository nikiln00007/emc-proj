const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: { type: String, required: true },   // firebaseUid
    userName: { type: String, required: true },
    userImage: { type: String, default: '' },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);
