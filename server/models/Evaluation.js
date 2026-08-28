const mongoose = require('mongoose');

const RubricCriterionSchema = new mongoose.Schema(
  {
    criterion: { type: String, required: true },
    maxScore: { type: Number, default: 25 },
    score: { type: Number, default: 0 },
    comment: { type: String, default: '' },
  },
  { _id: false }
);

const EvaluationSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentUid: { type: String, required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teacherUid: { type: String },
    teacherName: { type: String, default: 'Faculty Evaluator' },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'needs_revision', 'graded'],
      default: 'pending',
      index: true,
    },
    grade: { type: Number, min: 0, max: 10 },
    letterGrade: { type: String },
    rubric: [RubricCriterionSchema],
    feedback: { type: String, default: '' },
    privateNotes: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
    revisionRequestedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evaluation', EvaluationSchema);
