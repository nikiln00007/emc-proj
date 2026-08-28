const Project = require('../models/Project');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');

const SEED_USERS = [
  {
    firebaseUid: 'seed-teacher-1',
    name: 'Prof. Evelyn Reed',
    email: 'prof.reed@peerhub.edu',
    bio: 'Lead Faculty Evaluator & Senior Lecturer in Distributed Systems.',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'teacher',
    teacherProfile: {
      department: 'Computer Science & Engineering',
      subjects: ['Web Systems', 'Cloud Computing', 'Capstone Projects'],
      canGrade: true,
    },
  },
  {
    firebaseUid: 'seed-admin-1',
    name: 'Dr. Arthur Vance (Admin)',
    email: 'admin.vance@peerhub.edu',
    bio: 'Department Head & Academic Coordinator.',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    teacherProfile: {
      department: 'Dean of Computing',
      subjects: ['Software Architecture', 'Accreditation'],
      canGrade: true,
    },
  },
  {
    firebaseUid: 'seed-user-1',
    name: 'Alex Johnson',
    email: 'alex.johnson@student.peerhub.edu',
    bio: 'Full-stack developer building real-time collaboration tools.',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'student',
  },
  {
    firebaseUid: 'seed-user-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@student.peerhub.edu',
    bio: 'AI & Full-stack enthusiast. Focused on developer tooling.',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'student',
  },
  {
    firebaseUid: 'seed-user-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@student.peerhub.edu',
    bio: 'Frontend visualizer & 3D graphics coder.',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'student',
  },
  {
    firebaseUid: 'seed-user-4',
    name: 'Priya Patel',
    email: 'priya.patel@student.peerhub.edu',
    bio: 'Product engineer & campus marketplace builder.',
    profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'student',
  },
  {
    firebaseUid: 'seed-user-5',
    name: 'David Kim',
    email: 'david.kim@student.peerhub.edu',
    bio: 'Productivity workflows and systems builder.',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'student',
  },
  {
    firebaseUid: 'seed-user-6',
    name: 'Elena Rostova',
    email: 'elena.rostova@student.peerhub.edu',
    bio: 'Machine learning & in-browser neural simulation.',
    profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    role: 'student',
  },
];

const SEED_PROJECTS = [
  {
    title: 'CodeCollab — Real-Time Pair Programming IDE',
    description: 'A browser-based collaborative code editor with real-time cursor sharing, embedded terminal, syntax highlighting for 20+ languages, and integrated WebRTC audio calls for peer debugging sessions.',
    tags: ['React', 'Node.js', 'WebSockets', 'MongoDB', 'JavaScript'],
    githubUrl: 'https://github.com/alexjohnson/codecollab',
    liveDemoUrl: 'https://codecollab-demo.vercel.app',
    owner: {
      firebaseUid: 'seed-user-1',
      name: 'Alex Johnson',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    likes: 42,
    likedBy: ['seed-user-2', 'seed-user-3'],
    bookmarkedBy: ['seed-user-2'],
    averageRating: 4.8,
    ratingCount: 18,
    isSubmittedForEvaluation: true,
    evaluationStatus: 'graded',
    submittedForEvaluationAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'DevPulse — AI-Powered Resume & Portfolio Reviewer',
    description: 'An AI assistant that scans student developer GitHub profiles and resumes, extracts skills, calculates ATS readiness score, and provides actionable code quality improvement suggestions.',
    tags: ['Python', 'React', 'AI', 'Node.js', 'TypeScript'],
    githubUrl: 'https://github.com/sarahchen/devpulse-ai',
    liveDemoUrl: 'https://devpulse.ai.preview',
    owner: {
      firebaseUid: 'seed-user-2',
      name: 'Sarah Chen',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    likes: 38,
    likedBy: ['seed-user-1'],
    bookmarkedBy: ['seed-user-1'],
    averageRating: 4.9,
    ratingCount: 24,
    isSubmittedForEvaluation: true,
    evaluationStatus: 'pending',
    submittedForEvaluationAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'AlgoVisualizer — Interactive 3D Algorithm Explorer',
    description: 'Step-by-step 3D visualizations for sorting algorithms, graph traversals (Dijkstra, A*), dynamic programming trees, and binary search trees with adjustable execution speed.',
    tags: ['JavaScript', 'React', 'Three.js', 'CSS'],
    githubUrl: 'https://github.com/marcusv/algo-visualizer',
    liveDemoUrl: 'https://algoviz-3d.vercel.app',
    owner: {
      firebaseUid: 'seed-user-3',
      name: 'Marcus Vance',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    likes: 29,
    likedBy: ['seed-user-1', 'seed-user-2'],
    bookmarkedBy: [],
    averageRating: 4.7,
    ratingCount: 14,
    isSubmittedForEvaluation: true,
    evaluationStatus: 'in_review',
    submittedForEvaluationAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'CampusCart — Student Peer Marketplace & Exchange',
    description: 'A verified campus-only marketplace platform where university students buy, sell, or rent textbooks, electronics, dorm essentials, and exchange study notes with in-app chat.',
    tags: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
    githubUrl: 'https://github.com/priyapatel/campus-cart',
    liveDemoUrl: 'https://campuscart-live.com',
    owner: {
      firebaseUid: 'seed-user-4',
      name: 'Priya Patel',
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    likes: 25,
    likedBy: ['seed-user-3'],
    bookmarkedBy: ['seed-user-1'],
    averageRating: 4.6,
    ratingCount: 9,
    isSubmittedForEvaluation: true,
    evaluationStatus: 'needs_revision',
    submittedForEvaluationAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'TaskFlow — Intelligent Kanban & Study Tracker',
    description: 'A productivity app for engineering students with automated Pomodoro timers, GitHub commit tracking integration, task dependency graphing, and weekly velocity charts.',
    tags: ['TypeScript', 'React', 'Node.js', 'MongoDB'],
    githubUrl: 'https://github.com/davidkim/taskflow-pro',
    liveDemoUrl: 'https://taskflow-study.vercel.app',
    owner: {
      firebaseUid: 'seed-user-5',
      name: 'David Kim',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    likes: 31,
    likedBy: ['seed-user-1', 'seed-user-4'],
    bookmarkedBy: ['seed-user-2'],
    averageRating: 4.5,
    ratingCount: 11,
    isSubmittedForEvaluation: true,
    evaluationStatus: 'graded',
    submittedForEvaluationAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'NeuralPlayground — Deep Learning in the Browser',
    description: 'Train neural networks directly inside your browser with WebGL acceleration. Interactive loss graphs, decision boundary plots, and convolutional filter visualizers.',
    tags: ['Python', 'AI', 'JavaScript', 'React'],
    githubUrl: 'https://github.com/elenar/neural-playground',
    liveDemoUrl: 'https://neuralplayground.app',
    owner: {
      firebaseUid: 'seed-user-6',
      name: 'Elena Rostova',
      profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    },
    likes: 45,
    likedBy: ['seed-user-2', 'seed-user-5'],
    bookmarkedBy: ['seed-user-3'],
    averageRating: 4.9,
    ratingCount: 21,
    isSubmittedForEvaluation: false,
    evaluationStatus: 'not_submitted',
  },
];

const seedDatabase = async () => {
  try {
    // 1. Seed Users
    for (const u of SEED_USERS) {
      await User.findOneAndUpdate({ firebaseUid: u.firebaseUid }, u, { upsert: true, new: true });
    }

    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      console.log('🌱 Seeding initial showcase projects...');
      const createdProjects = await Project.insertMany(SEED_PROJECTS);
      console.log(`✅ Seeded ${createdProjects.length} showcase projects successfully.`);

      // Seed evaluations
      const teacher = await User.findOne({ role: 'teacher' });

      // Graded evaluation 1 (CodeCollab)
      const p1 = createdProjects[0];
      const u1 = await User.findOne({ firebaseUid: p1.owner.firebaseUid });
      await Evaluation.create({
        project: p1._id,
        student: u1?._id,
        studentUid: p1.owner.firebaseUid,
        teacher: teacher?._id,
        teacherUid: teacher?.firebaseUid,
        teacherName: teacher?.name || 'Prof. Evelyn Reed',
        status: 'graded',
        grade: 9.6,
        letterGrade: 'A+',
        rubric: [
          { criterion: 'Code Quality & Architecture', maxScore: 25, score: 24, comment: 'Clean modular structure with well-isolated sockets.' },
          { criterion: 'UI/UX Polish & Responsiveness', maxScore: 25, score: 25, comment: 'Flawless design, animations, and color scheme.' },
          { criterion: 'Technical Innovation', maxScore: 25, score: 23, comment: 'Great WebRTC integration and multi-user sync.' },
          { criterion: 'Documentation & Git', maxScore: 25, score: 24, comment: 'Comprehensive README and clear commit history.' },
        ],
        feedback: 'Outstanding implementation of WebRTC signaling and WebSockets. Architecture is clean, responsive, and production-ready. Exceptional work!',
        privateNotes: 'Exceeds standard capstone criteria. Recommend this student for honors showcase.',
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      });

      // Pending evaluation 2 (DevPulse)
      const p2 = createdProjects[1];
      const u2 = await User.findOne({ firebaseUid: p2.owner.firebaseUid });
      await Evaluation.create({
        project: p2._id,
        student: u2?._id,
        studentUid: p2.owner.firebaseUid,
        status: 'pending',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });

      // In-review evaluation 3 (AlgoVisualizer)
      const p3 = createdProjects[2];
      const u3 = await User.findOne({ firebaseUid: p3.owner.firebaseUid });
      await Evaluation.create({
        project: p3._id,
        student: u3?._id,
        studentUid: p3.owner.firebaseUid,
        teacher: teacher?._id,
        teacherUid: teacher?.firebaseUid,
        teacherName: teacher?.name || 'Prof. Evelyn Reed',
        status: 'in_review',
        grade: 8.8,
        letterGrade: 'A-',
        rubric: [
          { criterion: 'Code Quality & Architecture', maxScore: 25, score: 22, comment: 'Good component breakdown.' },
          { criterion: 'UI/UX Polish & Responsiveness', maxScore: 25, score: 24, comment: 'Interactive 3D canvas is smooth.' },
          { criterion: 'Technical Innovation', maxScore: 25, score: 22, comment: 'Three.js algorithms are impressive.' },
          { criterion: 'Documentation & Git', maxScore: 25, score: 20, comment: 'Add performance benchmarks in README.' },
        ],
        feedback: 'Draft evaluation started. Looking very strong.',
        privateNotes: 'Check mobile WebGL rendering before final publish.',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      });

      // Needs revision evaluation 4 (CampusCart)
      const p4 = createdProjects[3];
      const u4 = await User.findOne({ firebaseUid: p4.owner.firebaseUid });
      await Evaluation.create({
        project: p4._id,
        student: u4?._id,
        studentUid: p4.owner.firebaseUid,
        teacher: teacher?._id,
        teacherUid: teacher?.firebaseUid,
        teacherName: teacher?.name || 'Prof. Evelyn Reed',
        status: 'needs_revision',
        grade: 7.2,
        letterGrade: 'B-',
        rubric: [
          { criterion: 'Code Quality & Architecture', maxScore: 25, score: 18, comment: 'Missing input sanitization in chat endpoint.' },
          { criterion: 'UI/UX Polish & Responsiveness', maxScore: 25, score: 20, comment: 'Mobile drawer needs polish.' },
          { criterion: 'Technical Innovation', maxScore: 25, score: 17, comment: 'Standard CRUD, add search indexing.' },
          { criterion: 'Documentation & Git', maxScore: 25, score: 17, comment: 'Provide environment setup docs.' },
        ],
        feedback: 'Good foundation, but please fix the chat route security checks and provide clear environment variables instructions.',
        privateNotes: 'Requested revision for security vulnerability in chat route.',
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        revisionRequestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      });

      // Graded evaluation 5 (TaskFlow)
      const p5 = createdProjects[4];
      const u5 = await User.findOne({ firebaseUid: p5.owner.firebaseUid });
      await Evaluation.create({
        project: p5._id,
        student: u5?._id,
        studentUid: p5.owner.firebaseUid,
        teacher: teacher?._id,
        teacherUid: teacher?.firebaseUid,
        teacherName: teacher?.name || 'Prof. Evelyn Reed',
        status: 'graded',
        grade: 8.9,
        letterGrade: 'A-',
        rubric: [
          { criterion: 'Code Quality & Architecture', maxScore: 25, score: 23, comment: 'Great TypeScript types and clean store.' },
          { criterion: 'UI/UX Polish & Responsiveness', maxScore: 25, score: 22, comment: 'Drag and drop is responsive.' },
          { criterion: 'Technical Innovation', maxScore: 25, score: 22, comment: 'GitHub commit integration is slick.' },
          { criterion: 'Documentation & Git', maxScore: 25, score: 22, comment: 'Good instructions.' },
        ],
        feedback: 'Solid, well-crafted application. Great usage of TypeScript and Pomodoro workflows.',
        privateNotes: 'Student did an excellent job on state management.',
        submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });

      console.log('✅ Seeded sample evaluations across all statuses.');
    }
  } catch (err) {
    console.warn('Seed notice:', err.message);
  }
};

module.exports = { seedDatabase, SEED_PROJECTS, SEED_USERS };
