import { SHOWCASE_PROJECTS } from './showcaseData';

const USER_PROJECTS_KEY = 'peerhub_user_projects';
const COMMENTS_KEY = 'peerhub_project_comments';
const EVALUATIONS_KEY = 'peerhub_project_evaluations';

// Get all combined projects (user-created first, then showcase)
export function getLocalProjects() {
  try {
    const userProjects = JSON.parse(localStorage.getItem(USER_PROJECTS_KEY) || '[]');
    return [...userProjects, ...SHOWCASE_PROJECTS];
  } catch (e) {
    return SHOWCASE_PROJECTS;
  }
}

// Find single project by ID
export function getLocalProjectById(id) {
  const all = getLocalProjects();
  return all.find(p => String(p._id) === String(id)) || null;
}

// Save a new project locally
export function saveLocalProject(project) {
  const userProjects = JSON.parse(localStorage.getItem(USER_PROJECTS_KEY) || '[]');
  const newProject = {
    ...project,
    _id: project._id || 'proj-user-' + Date.now(),
    likes: project.likes || 0,
    likedBy: project.likedBy || [],
    bookmarkedBy: project.bookmarkedBy || [],
    averageRating: project.averageRating || 0,
    ratingCount: project.ratingCount || 0,
    ratings: project.ratings || [],
    createdAt: project.createdAt || new Date().toISOString(),
  };
  userProjects.unshift(newProject);
  localStorage.setItem(USER_PROJECTS_KEY, JSON.stringify(userProjects));
  return newProject;
}

// Update existing project
export function updateLocalProject(id, updates) {
  const userProjects = JSON.parse(localStorage.getItem(USER_PROJECTS_KEY) || '[]');
  const index = userProjects.findIndex(p => String(p._id) === String(id));
  if (index !== -1) {
    userProjects[index] = { ...userProjects[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(USER_PROJECTS_KEY, JSON.stringify(userProjects));
    return userProjects[index];
  }
  return null;
}

// Delete project
export function deleteLocalProject(id) {
  const userProjects = JSON.parse(localStorage.getItem(USER_PROJECTS_KEY) || '[]');
  const filtered = userProjects.filter(p => String(p._id) !== String(id));
  localStorage.setItem(USER_PROJECTS_KEY, JSON.stringify(filtered));
}

// Comments storage
export function getLocalComments(projectId) {
  try {
    const map = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    if (map[projectId]) return map[projectId];

    // default demo comments for showcase projects
    return [
      {
        _id: 'c1',
        projectId,
        userName: 'David Kim',
        userImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Super clean architecture and great choice of tech stack! Really loved the UI and responsiveness.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'c2',
        projectId,
        userName: 'Sarah Chen',
        userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'The live demo runs smoothly. Great job on the documentation and structure!',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  } catch (e) {
    return [];
  }
}

export function addLocalComment(projectId, comment) {
  const map = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
  const list = map[projectId] || getLocalComments(projectId);
  const newComment = {
    ...comment,
    _id: 'cmt-' + Date.now(),
    projectId,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newComment);
  map[projectId] = list;
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(map));
  return newComment;
}

export function deleteLocalComment(projectId, commentId) {
  const map = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
  const list = map[projectId] || getLocalComments(projectId);
  map[projectId] = list.filter(c => String(c._id) !== String(commentId));
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(map));
}

// ── Teacher / Judge Evaluations & Grading Rubric ──────────────────────────────
export function getEvaluationsMap() {
  try {
    const data = localStorage.getItem(EVALUATIONS_KEY);
    if (data) return JSON.parse(data);

    // Initial demo evaluation for CodeCollab
    const initialMap = {
      'proj-codecollab-01': {
        projectId: 'proj-codecollab-01',
        evaluatorName: 'Prof. Evelyn Reed (Lead Evaluator)',
        evaluatorRole: 'Computer Science Dept.',
        scores: {
          codeQuality: 24,       // /25
          uiUx: 25,              // /25
          innovation: 23,        // /25
          documentation: 24,     // /25
        },
        totalScore: 96,
        grade: 'A+',
        feedback: 'Outstanding implementation of WebRTC signaling and WebSockets. Architecture is clean, responsive, and production-ready. Exceptional work!',
        evaluatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }
    };
    localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(initialMap));
    return initialMap;
  } catch (e) {
    return {};
  }
}

export function getProjectEvaluation(projectId) {
  const map = getEvaluationsMap();
  return map[projectId] || null;
}

export function saveProjectEvaluation(projectId, evalData) {
  const map = getEvaluationsMap();
  
  // Calculate total score & letter grade
  const { codeQuality = 0, uiUx = 0, innovation = 0, documentation = 0 } = evalData.scores || {};
  const totalScore = Math.min(100, Math.max(0, Number(codeQuality) + Number(uiUx) + Number(innovation) + Number(documentation)));
  
  let grade = 'F';
  if (totalScore >= 95) grade = 'A+';
  else if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 85) grade = 'A-';
  else if (totalScore >= 80) grade = 'B+';
  else if (totalScore >= 75) grade = 'B';
  else if (totalScore >= 70) grade = 'B-';
  else if (totalScore >= 60) grade = 'C';
  else if (totalScore >= 50) grade = 'D';

  const newEval = {
    projectId,
    evaluatorName: evalData.evaluatorName || 'Course Instructor',
    evaluatorRole: evalData.evaluatorRole || 'Faculty Evaluator',
    scores: {
      codeQuality: Number(codeQuality),
      uiUx: Number(uiUx),
      innovation: Number(innovation),
      documentation: Number(documentation),
    },
    totalScore,
    grade,
    feedback: evalData.feedback || 'Good project execution.',
    evaluatedAt: new Date().toISOString(),
  };

  map[projectId] = newEval;
  localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(map));
  return newEval;
}
