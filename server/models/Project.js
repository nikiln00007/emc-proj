const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 2000 },
    tags: { type: [String], required: true, validate: v => v.length > 0 },
    githubUrl: { type: String, required: true },
    liveDemoUrl: { type: String, default: '' },
    // Owner snapshot — avoids a join on every feed load
    owner: {
      firebaseUid: { type: String, required: true, index: true },
      name: { type: String, required: true },
      profileImage: { type: String, default: '' },
    },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },        // array of firebaseUids
    bookmarkedBy: { type: [String], default: [] },   // array of firebaseUids
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    ratings: [
      {
        userId: { type: String, required: true },
        value: { type: Number, min: 1, max: 5, required: true },
      },
    ],
    isSubmittedForEvaluation: { type: Boolean, default: false },
    evaluationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'in_review', 'needs_revision', 'graded'],
      default: 'not_submitted',
      index: true,
    },
    submittedForEvaluationAt: { type: Date },
  },
  { timestamps: true }
);

// Text index for search
ProjectSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Project', ProjectSchema);
