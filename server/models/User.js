const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    bio: { type: String, default: '', maxlength: 300 },
    profileImage: { type: String, default: '' },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    teacherProfile: {
      department: { type: String, default: '' },
      subjects: { type: [String], default: [] },
      canGrade: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
