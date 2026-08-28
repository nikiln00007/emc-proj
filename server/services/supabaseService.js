/**
 * supabaseService.js
 * Central data-access layer for all Supabase operations.
 * Each method returns {data, error} — callers decide how to handle errors.
 */

const { supabase } = require('../config/supabase');

// ── Helpers ────────────────────────────────────────────────────────────────────

const db = () => supabase;

/** Convert camelCase field names used by old Mongoose controllers → snake_case for Supabase */
const toCamel = (row) => {
  if (!row) return null;
  const map = {
    firebase_uid:                   'firebaseUid',
    profile_image:                  'profileImage',
    can_grade:                      'canGrade',
    github_url:                     'githubUrl',
    live_demo_url:                   'liveDemoUrl',
    owner_uid:                      'ownerUid',
    owner_name:                     'ownerName',
    owner_image:                    'ownerImage',
    liked_by:                       'likedBy',
    bookmarked_by:                  'bookmarkedBy',
    average_rating:                 'averageRating',
    rating_count:                   'ratingCount',
    is_submitted_for_evaluation:    'isSubmittedForEvaluation',
    evaluation_status:              'evaluationStatus',
    submitted_for_evaluation_at:    'submittedForEvaluationAt',
    created_at:                     'createdAt',
    updated_at:                     'updatedAt',
    project_id:                     'projectId',
    user_id:                        'userId',
    user_name:                      'userName',
    user_image:                     'userImage',
    student_uid:                    'studentUid',
    teacher_uid:                    'teacherUid',
    teacher_name:                   'teacherName',
    letter_grade:                   'letterGrade',
    private_notes:                  'privateNotes',
    submitted_at:                   'submittedAt',
    graded_at:                      'gradedAt',
    revision_requested_at:          'revisionRequestedAt',
  };

  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[map[k] || k] = v;
  }

  // Build nested owner object for projects (to stay compatible with old API shape)
  if (out.ownerUid !== undefined) {
    out.owner = {
      firebaseUid:  out.ownerUid,
      name:         out.ownerName || '',
      profileImage: out.ownerImage || '',
    };
  }

  // Alias _id → id for compatibility
  if (out.id) out._id = out.id;

  return out;
};

const mapRows = (rows) => (rows || []).map(toCamel);

// ── USERS ──────────────────────────────────────────────────────────────────────

const upsertUser = async ({ firebaseUid, email, name, profileImage, role, department, subjects, canGrade }) => {
  const { data, error } = await db()
    .from('users')
    .upsert(
      {
        firebase_uid:  firebaseUid,
        email:         email || null,
        name:          name || email?.split('@')[0] || 'Developer',
        profile_image: profileImage || '',
        role:          role || 'student',
        department:    department || null,
        subjects:      subjects || null,
        can_grade:     canGrade || false,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'firebase_uid', returning: 'representation' }
    )
    .select()
    .single();
  return { data: toCamel(data), error };
};

const getUserByUid = async (firebaseUid) => {
  const { data, error } = await db()
    .from('users')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .maybeSingle();
  return { data: toCamel(data), error };
};

const updateUser = async (firebaseUid, updates) => {
  const mapped = {};
  if (updates.name        !== undefined) mapped.name          = updates.name;
  if (updates.bio         !== undefined) mapped.bio           = updates.bio;
  if (updates.profileImage !== undefined) mapped.profile_image = updates.profileImage;
  if (updates.role        !== undefined) mapped.role          = updates.role;
  if (updates.department  !== undefined) mapped.department    = updates.department;
  if (updates.subjects    !== undefined) mapped.subjects      = updates.subjects;
  if (updates.canGrade    !== undefined) mapped.can_grade     = updates.canGrade;
  mapped.updated_at = new Date().toISOString();

  const { data, error } = await db()
    .from('users')
    .update(mapped)
    .eq('firebase_uid', firebaseUid)
    .select()
    .single();
  return { data: toCamel(data), error };
};

const getAllStudents = async () => {
  const { data, error } = await db()
    .from('users')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  return { data: mapRows(data), error };
};

const getAllTeachers = async () => {
  const { data, error } = await db()
    .from('users')
    .select('*')
    .in('role', ['teacher', 'admin'])
    .order('created_at', { ascending: false });
  return { data: mapRows(data), error };
};

// ── PROJECTS ──────────────────────────────────────────────────────────────────

const getProjects = async ({ search, tag, owner, page = 1, limit = 9 } = {}) => {
  let query = db()
    .from('projects')
    .select('*', { count: 'exact' });

  if (owner)  query = query.eq('owner_uid', owner);
  if (tag)    query = query.contains('tags', [tag]);
  if (search) query = query.ilike('title', `%${search}%`);

  const skip = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(skip, skip + limit - 1);

  const { data, error, count } = await query;
  return {
    data: mapRows(data),
    total: count || 0,
    error,
  };
};

const getProjectById = async (id) => {
  const { data, error } = await db()
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return { data: toCamel(data), error };
};

const createProject = async ({ title, description, tags, githubUrl, liveDemoUrl, ownerUid, ownerName, ownerImage }) => {
  const { data, error } = await db()
    .from('projects')
    .insert({
      title,
      description,
      tags:           Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()),
      github_url:     githubUrl,
      live_demo_url:  liveDemoUrl || '',
      owner_uid:      ownerUid,
      owner_name:     ownerName || 'Anonymous',
      owner_image:    ownerImage || '',
    })
    .select()
    .single();
  return { data: toCamel(data), error };
};

const updateProject = async (id, updates) => {
  const mapped = {};
  if (updates.title       !== undefined) mapped.title         = updates.title;
  if (updates.description !== undefined) mapped.description   = updates.description;
  if (updates.tags        !== undefined) mapped.tags          = Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim());
  if (updates.githubUrl   !== undefined) mapped.github_url    = updates.githubUrl;
  if (updates.liveDemoUrl !== undefined) mapped.live_demo_url = updates.liveDemoUrl;
  mapped.updated_at = new Date().toISOString();

  const { data, error } = await db()
    .from('projects')
    .update(mapped)
    .eq('id', id)
    .select()
    .single();
  return { data: toCamel(data), error };
};

const deleteProject = async (id) => {
  const { error } = await db().from('projects').delete().eq('id', id);
  return { error };
};

const toggleLike = async (id, uid) => {
  // Fetch current likedBy array
  const { data: proj } = await db().from('projects').select('liked_by, likes').eq('id', id).single();
  if (!proj) return { data: null, error: { message: 'Project not found' } };

  const likedBy = proj.liked_by || [];
  const already = likedBy.includes(uid);
  const newLikedBy = already ? likedBy.filter(u => u !== uid) : [...likedBy, uid];
  const newLikes   = Math.max(0, already ? proj.likes - 1 : proj.likes + 1);

  const { data, error } = await db()
    .from('projects')
    .update({ liked_by: newLikedBy, likes: newLikes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('liked_by, likes')
    .single();

  return { data: { liked: !already, likes: newLikes }, error };
};

const toggleBookmark = async (id, uid) => {
  const { data: proj } = await db().from('projects').select('bookmarked_by').eq('id', id).single();
  if (!proj) return { data: null, error: { message: 'Project not found' } };

  const bookmarkedBy = proj.bookmarked_by || [];
  const already = bookmarkedBy.includes(uid);
  const newArr = already ? bookmarkedBy.filter(u => u !== uid) : [...bookmarkedBy, uid];

  const { error } = await db()
    .from('projects')
    .update({ bookmarked_by: newArr, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { data: { bookmarked: !already }, error };
};

const rateProject = async (id, uid, value) => {
  const { data: proj } = await db().from('projects').select('ratings').eq('id', id).single();
  if (!proj) return { data: null, error: { message: 'Project not found' } };

  const ratings = proj.ratings || [];
  const idx = ratings.findIndex(r => r.userId === uid);
  if (idx >= 0) ratings[idx].value = value;
  else ratings.push({ userId: uid, value });

  const total = ratings.reduce((s, r) => s + r.value, 0);
  const avgRating = parseFloat((total / ratings.length).toFixed(1));

  const { data, error } = await db()
    .from('projects')
    .update({ ratings, average_rating: avgRating, rating_count: ratings.length, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('average_rating, rating_count')
    .single();
  return { data: { averageRating: avgRating, ratingCount: ratings.length, userRating: value }, error };
};

const submitProjectForEvaluation = async (id) => {
  const { data, error } = await db()
    .from('projects')
    .update({
      is_submitted_for_evaluation: true,
      evaluation_status:           'pending',
      submitted_for_evaluation_at: new Date().toISOString(),
      updated_at:                  new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  return { data: toCamel(data), error };
};

const getBookmarkedProjects = async (uid) => {
  const { data, error } = await db()
    .from('projects')
    .select('*')
    .contains('bookmarked_by', [uid])
    .order('created_at', { ascending: false });
  return { data: mapRows(data), error };
};

// ── COMMENTS ──────────────────────────────────────────────────────────────────

const getCommentsByProjectId = async (projectId) => {
  const { data, error } = await db()
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return { data: mapRows(data), error };
};

const createComment = async ({ projectId, userId, userName, userImage, text }) => {
  const { data, error } = await db()
    .from('comments')
    .insert({ project_id: projectId, user_id: userId, user_name: userName, user_image: userImage || '', text })
    .select()
    .single();
  return { data: toCamel(data), error };
};

const deleteComment = async (id, uid) => {
  // Fetch first to enforce ownership
  const { data: comment } = await db().from('comments').select('user_id').eq('id', id).maybeSingle();
  if (!comment) return { error: { message: 'Comment not found', status: 404 } };
  if (uid && comment.user_id !== uid) return { error: { message: 'Forbidden', status: 403 } };

  const { error } = await db().from('comments').delete().eq('id', id);
  return { error };
};

// ── EVALUATIONS ───────────────────────────────────────────────────────────────

const getEvaluationByProjectId = async (projectId) => {
  const { data, error } = await db()
    .from('evaluations')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  return { data: toCamel(data), error };
};

const getEvaluationById = async (id) => {
  const { data, error } = await db()
    .from('evaluations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return { data: toCamel(data), error };
};

const getAllEvaluations = async ({ status, studentUid, page = 1, limit = 20 } = {}) => {
  let query = db().from('evaluations').select('*, projects(*)', { count: 'exact' });
  if (status && status !== 'all') query = query.eq('status', status);
  if (studentUid) query = query.eq('student_uid', studentUid);
  const skip = (page - 1) * limit;
  query = query.order('updated_at', { ascending: false }).range(skip, skip + limit - 1);

  const { data, error, count } = await query;
  return { data: mapRows(data), total: count || 0, error };
};

const getPendingEvaluations = async ({ status, tag, search } = {}) => {
  const statuses = status ? [status] : ['pending', 'in_review', 'needs_revision'];
  let query = db()
    .from('evaluations')
    .select('*, projects(*), users!evaluations_student_uid_fkey(*)')
    .in('status', statuses)
    .order('submitted_at', { ascending: true });

  const { data, error } = await query;
  return { data: mapRows(data), error };
};

const upsertEvaluation = async ({ projectId, studentUid, teacherUid, teacherName, status, grade, letterGrade, rubric, feedback, privateNotes }) => {
  const now = new Date().toISOString();
  const record = {
    project_id:    projectId,
    student_uid:   studentUid || '',
    teacher_uid:   teacherUid || null,
    teacher_name:  teacherName || 'Faculty Evaluator',
    status:        status || 'pending',
    rubric:        rubric || [],
    feedback:      feedback || '',
    private_notes: privateNotes || '',
    updated_at:    now,
  };
  if (grade !== undefined && grade !== null) {
    record.grade        = parseFloat(grade);
    record.letter_grade = letterGrade || '';
  }
  if (status === 'graded') record.graded_at = now;
  if (status === 'needs_revision') record.revision_requested_at = now;

  const { data, error } = await db()
    .from('evaluations')
    .upsert(record, { onConflict: 'project_id', returning: 'representation' })
    .select()
    .single();
  return { data: toCamel(data), error };
};

const updateProjectEvaluationStatus = async (projectId, evaluationStatus) => {
  const { error } = await db()
    .from('projects')
    .update({ evaluation_status: evaluationStatus, is_submitted_for_evaluation: true, updated_at: new Date().toISOString() })
    .eq('id', projectId);
  return { error };
};

const getGradebook = async () => {
  const [studentsRes, projectsRes, evaluationsRes] = await Promise.all([
    db().from('users').select('*').eq('role', 'student'),
    db().from('projects').select('*').eq('is_submitted_for_evaluation', true),
    db().from('evaluations').select('*'),
  ]);
  return {
    students:    mapRows(studentsRes.data),
    projects:    mapRows(projectsRes.data),
    evaluations: mapRows(evaluationsRes.data),
    error:       studentsRes.error || projectsRes.error || evaluationsRes.error,
  };
};

const getAnalyticsData = async () => {
  const [evalsRes, projectsRes, studentsRes] = await Promise.all([
    db().from('evaluations').select('*'),
    db().from('projects').select('*'),
    db().from('users').select('*').eq('role', 'student'),
  ]);
  return {
    evaluations: mapRows(evalsRes.data),
    projects:    mapRows(projectsRes.data),
    students:    mapRows(studentsRes.data),
    error:       evalsRes.error || projectsRes.error || studentsRes.error,
  };
};

const getDbAnalytics = async () => {
  const [userCount, projectCount, commentCount, topLiked, totalLikesRes] = await Promise.all([
    db().from('users').select('id', { count: 'exact', head: true }),
    db().from('projects').select('id', { count: 'exact', head: true }),
    db().from('comments').select('id', { count: 'exact', head: true }),
    db().from('projects').select('id,title,likes,average_rating,owner_name').order('likes', { ascending: false }).limit(1).maybeSingle(),
    db().from('projects').select('likes'),
  ]);

  const totalLikes = (totalLikesRes.data || []).reduce((s, r) => s + (r.likes || 0), 0);
  return {
    totalUsers:          userCount.count || 0,
    totalProjects:       projectCount.count || 0,
    totalComments:       commentCount.count || 0,
    totalLikes,
    mostLikedProject:   toCamel(topLiked.data) || null,
    error:               userCount.error,
  };
};

module.exports = {
  // Users
  upsertUser, getUserByUid, updateUser, getAllStudents, getAllTeachers,
  // Projects
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  toggleLike, toggleBookmark, rateProject, submitProjectForEvaluation, getBookmarkedProjects,
  // Comments
  getCommentsByProjectId, createComment, deleteComment,
  // Evaluations
  getEvaluationByProjectId, getEvaluationById, getAllEvaluations, getPendingEvaluations,
  upsertEvaluation, updateProjectEvaluationStatus, getGradebook, getAnalyticsData,
  // Analytics
  getDbAnalytics,
};
