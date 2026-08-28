const mongoose = require('mongoose');
const Project = require('../models/Project');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');

const findProjectByIdOrString = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const p = await Project.findById(id);
    if (p) return p;
  }
  return await Project.findOne({ _id: id });
};

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 9);
    const skip = (page - 1) * limit;

    const { search, tag, owner } = req.query;
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }
    if (owner) {
      query['owner.firebaseUid'] = owner;
    }

    const [projects, total] = await Promise.all([
      Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Project.countDocuments(query),
    ]);

    res.json({
      projects,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const project = await findProjectByIdOrString(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Look for evaluation
    let evaluation = await Evaluation.findOne({ project: project._id }).populate('teacher', 'name profileImage');
    
    // Convert to plain object to attach evaluation
    const projectObj = project.toObject();

    if (evaluation) {
      const evalObj = evaluation.toObject();
      // Check if requester has teacher/admin privileges
      const isTeacherOrAdmin = req.user && (req.user.role === 'teacher' || req.user.role === 'admin');
      if (!isTeacherOrAdmin) {
        delete evalObj.privateNotes; // Security: NEVER leak privateNotes to students
      }
      projectObj.evaluation = evalObj;
    }

    res.json(projectObj);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/submit-for-evaluation
const submitForEvaluation = async (req, res, next) => {
  try {
    const project = await findProjectByIdOrString(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (req.user && project.owner.firebaseUid !== req.user.uid && project.owner.firebaseUid !== 'dev-user') {
      return res.status(403).json({ message: 'Forbidden: you can only submit your own project for evaluation.' });
    }

    project.isSubmittedForEvaluation = true;
    project.evaluationStatus = 'pending';
    project.submittedForEvaluationAt = new Date();
    await project.save();

    let studentUser = req.user ? await User.findOne({ firebaseUid: req.user.uid }) : null;

    // Upsert or reset evaluation document
    const evaluation = await Evaluation.findOneAndUpdate(
      { project: project._id },
      {
        project: project._id,
        student: studentUser?._id,
        studentUid: req.user?.uid || 'dev-user',
        status: 'pending',
        submittedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({
      message: 'Project successfully submitted for faculty evaluation.',
      project,
      evaluation,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { title, description, tags, githubUrl, liveDemoUrl } = req.body;

    if (!title || !description || !tags || !githubUrl) {
      return res.status(400).json({ message: 'Title, description, tags, and GitHub URL are required.' });
    }

    const user = req.dbUser;
    const project = await Project.create({
      title,
      description,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
      githubUrl,
      liveDemoUrl: liveDemoUrl || '',
      owner: {
        firebaseUid: req.user?.uid || 'dev-user',
        name: user ? user.name : req.body.ownerName || 'Anonymous',
        profileImage: user ? user.profileImage : '',
      },
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const project = await findProjectByIdOrString(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (req.user && project.owner.firebaseUid !== req.user.uid && project.owner.firebaseUid !== 'dev-user') {
      return res.status(403).json({ message: 'Forbidden: you do not own this project.' });
    }

    const { title, description, tags, githubUrl, liveDemoUrl } = req.body;
    if (title) project.title = title;
    if (description) project.description = description;
    if (tags) project.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    if (githubUrl) project.githubUrl = githubUrl;
    if (liveDemoUrl !== undefined) project.liveDemoUrl = liveDemoUrl;

    await project.save();
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await findProjectByIdOrString(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (req.user && project.owner.firebaseUid !== req.user.uid && project.owner.firebaseUid !== 'dev-user') {
      return res.status(403).json({ message: 'Forbidden: you do not own this project.' });
    }

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Project.findByIdAndDelete(req.params.id);
    } else {
      await Project.deleteOne({ _id: req.params.id });
    }

    // Also delete comments for this project
    const Comment = require('../models/Comment');
    await Comment.deleteMany({ projectId: req.params.id });

    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/bookmarks — get bookmarked projects for current user
const getBookmarkedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ bookmarkedBy: req.user.uid }).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getBookmarkedProjects,
  submitForEvaluation,
};
