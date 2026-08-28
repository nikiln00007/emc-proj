import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CommentCard from '../components/CommentCard';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  getLocalProjectById,
  getLocalComments,
  addLocalComment,
  deleteLocalComment,
  deleteLocalProject,
  getProjectEvaluation,
} from '../utils/projectStorage';
import StatusBadge from '../components/teacher/StatusBadge';
import GradePill from '../components/teacher/GradePill';
import { numericToLetter } from '../utils/gradeHelpers';

const TAG_COLORS = [
  'bg-orange-100 text-orange-700', 'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700', 'bg-pink-100 text-pink-700',
  'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
];
const tagColor = (tag) => {
  let h = 0; for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h);
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
};

function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <div className="text-4xl text-center mb-4">🗑️</div>
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Project?</h2>
        <p className="text-gray-500 text-sm text-center mb-7 leading-relaxed">
          This action cannot be undone. All comments and interactions will also be removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors justify-center flex items-center">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const { currentUser, dbUser, isTeacher } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [evaluation, setEvaluation] = useState(() => getProjectEvaluation(id));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Evaluation submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitToast, setSubmitToast] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setEvaluation(getProjectEvaluation(id));
      try {
        const [pRes, cRes] = await Promise.all([
          api.get(`/api/projects/${id}`),
          api.get(`/api/comments/${id}`),
        ]);
        const p = pRes.data;
        if (p && p._id) {
          setProject(p);
          setLikes(p.likes || 0);
          setAvgRating(p.averageRating || 0);
          setRatingCount(p.ratingCount || 0);
          // Capture evaluation embedded by backend (privateNotes already stripped for students)
          if (p.evaluation) setEvaluation(p.evaluation);
          if (currentUser) {
            setLiked(p.likedBy?.includes(currentUser.uid));
            setBookmarked(p.bookmarkedBy?.includes(currentUser.uid));
            const myRating = p.ratings?.find(r => r.userId === currentUser.uid);
            if (myRating) setUserRating(myRating.value);
          }
          setComments(cRes.data || []);
          return;
        }
      } catch (e) {
        console.warn('API lookup notice, checking local/showcase storage:', e.message);
      } finally {
        setLoading(false);
      }

      // Check local storage & showcase items
      const found = getLocalProjectById(id);
      if (found) {
        setProject(found);
        setLikes(found.likes || 0);
        setAvgRating(found.averageRating || 0);
        setRatingCount(found.ratingCount || 0);
        if (currentUser) {
          const likedList = JSON.parse(localStorage.getItem('peerhub_liked_' + currentUser.uid) || '[]');
          const bookmarkedList = JSON.parse(localStorage.getItem('peerhub_bookmarks_' + currentUser.uid) || '[]');
          setLiked(found.likedBy?.includes(currentUser.uid) || likedList.includes(id));
          setBookmarked(found.bookmarkedBy?.includes(currentUser.uid) || bookmarkedList.includes(id));
          const myRating = found.ratings?.find(r => r.userId === currentUser.uid);
          if (myRating) setUserRating(myRating.value);
        }
        setComments(getLocalComments(id));
        setError('');
      } else {
        setError('Project not found');
      }
    };
    load();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return navigate('/login');
    const prev = liked;
    const nextState = !prev;
    setLiked(nextState);
    setLikes(l => prev ? Math.max(0, l - 1) : l + 1);

    // Save locally
    const likedList = JSON.parse(localStorage.getItem('peerhub_liked_' + currentUser.uid) || '[]');
    if (nextState) {
      if (!likedList.includes(id)) likedList.push(id);
    } else {
      const idx = likedList.indexOf(id);
      if (idx !== -1) likedList.splice(idx, 1);
    }
    localStorage.setItem('peerhub_liked_' + currentUser.uid, JSON.stringify(likedList));

    try {
      await api.post(`/api/projects/${id}/like`);
    } catch {}
  };

  const handleBookmark = async () => {
    if (!currentUser) return navigate('/login');
    const prev = bookmarked;
    const nextState = !prev;
    setBookmarked(nextState);

    // Save locally
    const bookmarkedList = JSON.parse(localStorage.getItem('peerhub_bookmarks_' + currentUser.uid) || '[]');
    if (nextState) {
      if (!bookmarkedList.includes(id)) bookmarkedList.push(id);
    } else {
      const idx = bookmarkedList.indexOf(id);
      if (idx !== -1) bookmarkedList.splice(idx, 1);
    }
    localStorage.setItem('peerhub_bookmarks_' + currentUser.uid, JSON.stringify(bookmarkedList));

    try {
      await api.post(`/api/projects/${id}/bookmark`);
    } catch {}
  };

  const handleRate = async (value) => {
    if (!currentUser) return navigate('/login');
    setUserRating(value);
    setRatingCount(c => c + 1);
    setAvgRating(a => a > 0 ? parseFloat(((a + value) / 2).toFixed(1)) : value);

    try {
      const { data } = await api.post(`/api/projects/${id}/rating`, { value });
      if (data) {
        setAvgRating(data.averageRating);
        setRatingCount(data.ratingCount);
      }
    } catch {}
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPostingComment(true);

    const newCommentData = {
      projectId: id,
      text: commentText.trim(),
      userName: dbUser?.name || currentUser?.displayName || 'Student Developer',
      userImage: dbUser?.profileImage || currentUser?.photoURL || '',
      userId: currentUser?.uid || 'user-1',
    };

    try {
      const { data } = await api.post('/api/comments', newCommentData);
      if (data && data._id) {
        setComments(prev => [data, ...prev]);
        setCommentText('');
        setPostingComment(false);
        return;
      }
    } catch {}

    // Local comment fallback
    const localCmt = addLocalComment(id, newCommentData);
    setComments(prev => [localCmt, ...prev]);
    setCommentText('');
    setPostingComment(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/projects/${id}`);
    } catch {}
    deleteLocalProject(id);
    navigate('/my-projects');
  };

  const handleSubmitForEvaluation = async () => {
    if (!currentUser) return navigate('/login');
    setSubmitting(true);
    try {
      await api.post(`/api/projects/${id}/submit-for-evaluation`);
      setProject(prev => prev ? { ...prev, isSubmittedForEvaluation: true, evaluationStatus: 'pending' } : prev);
      setSubmitToast('✅ Submitted for faculty evaluation!');
      setTimeout(() => setSubmitToast(''), 3500);
    } catch (e) {
      setSubmitToast('❌ ' + (e.message || 'Submission failed.'));
      setTimeout(() => setSubmitToast(''), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <LoadingSpinner size="lg" text="Loading project..." />
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-500 mb-6">{error || 'This project may have been removed.'}</p>
        <Link to="/home" className="btn-primary">Back to Explore</Link>
      </div>
    </div>
  );

  const isOwner = currentUser?.uid === project.owner?.firebaseUid || project.owner?.firebaseUid === 'dev-user';
  const date = new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {showDelete && <ConfirmModal onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />}

      {/* Toast notification for submission */}
      {submitToast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm font-semibold
          px-4 py-2.5 rounded-xl shadow-xl">
          {submitToast}
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/home" className="hover:text-orange-500 transition-colors">Explore</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium line-clamp-1">{project.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="card p-8">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 mb-6" />
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">{project.title}</h1>

              {/* Author */}
              <Link to={`/profile/${project.owner?.firebaseUid}`} className="flex items-center gap-3 mb-6 group w-fit">
                {project.owner?.profileImage ? (
                  <img src={project.owner.profileImage} alt={project.owner.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">
                    {(project.owner?.name || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-orange-500 transition-colors">{project.owner?.name}</p>
                  <p className="text-xs text-gray-400">Published {date}</p>
                </div>
              </Link>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags?.map(tag => (
                  <span key={tag} className={`tag-pill text-sm px-3 py-1 ${tagColor(tag)}`}>{tag}</span>
                ))}
              </div>

              {/* Description */}
              <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line mb-6">{project.description}</p>
              
              {/* ── Official Teacher/Faculty Evaluation Card ─────────── */}
              {evaluation && (evaluation.status === 'graded' || evaluation.grade !== undefined) ? (
                <div className="mt-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-emerald-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md">
                        🏆
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-emerald-950 text-base">Official Faculty Evaluation</h3>
                          <GradePill grade={evaluation.grade} letterGrade={evaluation.letterGrade} />
                        </div>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Graded by <strong>{evaluation.teacher?.name || evaluation.evaluatorName || 'Faculty Reviewer'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide block">Final Grade</span>
                      <span className="text-2xl font-black text-emerald-900">
                        {evaluation.grade !== undefined && evaluation.grade !== null ? `${Number(evaluation.grade).toFixed(1)}/10` : (evaluation.letterGrade || '—')}
                      </span>
                    </div>
                  </div>

                  {/* Rubric Breakdown if available */}
                  {evaluation.rubric && evaluation.rubric.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {evaluation.rubric.map((r, idx) => (
                        <div key={idx} className="bg-white/80 border border-emerald-100 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-bold text-gray-800">{r.criterion}</p>
                            <span className="text-xs font-black text-emerald-800">{r.score} <span className="text-[10px] text-gray-400 font-normal">/ {r.maxScore}</span></span>
                          </div>
                          {r.comment && <p className="text-[11px] text-gray-500 italic mt-0.5">"{r.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Legacy Scores if available and no rubric array */}
                  {(!evaluation.rubric || evaluation.rubric.length === 0) && evaluation.scores && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                      {[
                        { label: 'Code Quality', score: evaluation.scores.codeQuality },
                        { label: 'UI/UX Polish', score: evaluation.scores.uiUx },
                        { label: 'Innovation', score: evaluation.scores.innovation },
                        { label: 'Documentation', score: evaluation.scores.documentation },
                      ].map(s => (
                        <div key={s.label} className="bg-white/80 border border-emerald-100 rounded-xl p-2.5 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{s.label}</p>
                          <p className="text-base font-black text-emerald-800">{s.score} <span className="text-[10px] text-gray-400 font-medium">/25</span></p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Remarks */}
                  {evaluation.feedback && (
                    <div className="bg-white/90 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-950 mb-4">
                      <p className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                        <span>💬 Faculty Feedback:</span>
                      </p>
                      <p className="leading-relaxed whitespace-pre-line">{evaluation.feedback}</p>
                    </div>
                  )}

                  {/* Student Re-evaluation button */}
                  {isOwner && !isTeacher && (
                    <div className="flex items-center justify-between pt-3 border-t border-emerald-200/60">
                      <span className="text-xs text-emerald-800 font-medium">Made improvements to your project?</span>
                      <button
                        onClick={handleSubmitForEvaluation}
                        disabled={submitting}
                        className="text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                      >
                        {submitting ? 'Submitting...' : '🔄 Request Re-evaluation'}
                      </button>
                    </div>
                  )}

                  {/* Teacher edit marks button */}
                  {isTeacher && (
                    <div className="pt-2">
                      <Link
                        to={`/teacher/evaluations/${id}`}
                        className="btn-primary text-xs py-2 px-4 w-full justify-center shadow-sm"
                      >
                        ✏️ Edit Marks & Rubric in Teacher Portal →
                      </Link>
                    </div>
                  )}
                </div>
              ) : project?.isSubmittedForEvaluation || project?.evaluationStatus === 'pending' || project?.evaluationStatus === 'in_review' || project?.evaluationStatus === 'needs_revision' ? (
                <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-900">Evaluation Status:</span>
                      <StatusBadge status={project.evaluationStatus || 'pending'} />
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      {project.evaluationStatus === 'needs_revision'
                        ? 'Faculty requested revisions before finalizing marks.'
                        : project.evaluationStatus === 'in_review'
                        ? 'A faculty reviewer is actively evaluating this submission.'
                        : 'This project is in the faculty review queue.'}
                    </p>
                  </div>
                  {isTeacher ? (
                    <Link
                      to={`/teacher/evaluations/${id}`}
                      className="btn-primary text-xs py-2 px-4 whitespace-nowrap shadow-sm"
                    >
                      📝 Grade in Teacher Portal →
                    </Link>
                  ) : isOwner ? (
                    <button
                      onClick={handleSubmitForEvaluation}
                      disabled={submitting}
                      className="btn-secondary text-xs py-2 px-3 whitespace-nowrap"
                    >
                      {submitting ? 'Submitting...' : '🔄 Update Submission'}
                    </button>
                  ) : null}
                </div>
              ) : isOwner && !isTeacher ? (
                <div className="mt-8 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                      <span>🎯 Ready for Evaluation?</span>
                      <span className="text-[11px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Optional</span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Submit your project to faculty judges to receive an official grade, rubric breakdown, and written feedback.
                    </p>
                  </div>
                  <button
                    onClick={handleSubmitForEvaluation}
                    disabled={submitting}
                    className="btn-primary text-xs py-2.5 px-4 whitespace-nowrap shadow-sm flex items-center gap-1.5"
                  >
                    {submitting ? 'Submitting...' : '🚀 Submit for Faculty Review'}
                  </button>
                </div>
              ) : isTeacher ? (
                <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-indigo-950 flex items-center gap-2">
                      <span>👨‍🏫 Faculty Evaluator Action</span>
                    </h4>
                    <p className="text-xs text-indigo-700 mt-1">
                      This student project is ready to be graded against the faculty rubric.
                    </p>
                  </div>
                  <Link
                    to={`/teacher/evaluations/${id}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm whitespace-nowrap transition-colors"
                  >
                    📝 Grade Submission →
                  </Link>
                </div>
              ) : null}
            </div>


            {/* Comments section */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Comments <span className="text-gray-400 font-normal text-base">({comments.length})</span>
              </h2>

              {currentUser ? (
                <form onSubmit={handlePostComment} className="mb-8">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">
                      {(dbUser?.name || currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Share your thoughts or ask a question about this project..."
                        className="form-input resize-none h-24"
                        maxLength={1000}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{commentText.length}/1000</span>
                        <button type="submit" disabled={postingComment || !commentText.trim()} className="btn-primary text-xs py-2 px-4 shadow-sm">
                          {postingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center mb-8">
                  <p className="text-gray-600 text-sm font-medium mb-3">Sign in to join the discussion and leave feedback.</p>
                  <Link to="/login" className="btn-primary text-xs py-2 px-4 inline-flex">
                    Sign In to Comment
                  </Link>
                </div>
              )}

              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map(c => (
                    <CommentCard key={c._id} comment={c} onDelete={handleDeleteComment} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Interactions card */}
            <div className="card p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Interactions</h3>

              {/* Like */}
              <button
                onClick={handleLike}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  liked ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
                  {liked ? 'Liked!' : 'Like'}
                </span>
                <span className="font-bold">{likes}</span>
              </button>

              {/* Bookmark */}
              <button
                onClick={handleBookmark}
                className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  bookmarked ? 'border-purple-400 bg-purple-50 text-purple-600' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-600'
                }`}
              >
                <span className="text-lg">{bookmarked ? '🔖' : '📌'}</span>
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>

              {/* Rating */}
              <div className="p-3 rounded-xl border-2 border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  {userRating ? `Your rating: ${userRating}/5` : 'Rate this project'}
                </p>
                <StarRating rating={userRating} onRate={handleRate} readOnly={!currentUser} size="md" />
                {ratingCount > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    ⭐ {avgRating.toFixed(1)} avg from {ratingCount} rating{ratingCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Links card */}
            <div className="card p-6 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Links</h3>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span className="font-semibold text-sm">View on GitHub</span>
                </a>
              )}
              {project.liveDemoUrl && (
                <a
                  href={project.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                >
                  <span className="text-lg">🚀</span>
                  <span className="font-semibold text-sm">Live Demo</span>
                </a>
              )}
            </div>

            {/* Student Owner Actions */}
            {isOwner && !isTeacher && (
              <div className="card p-6 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Manage</h3>
                <Link to={`/edit-project/${id}`} className="btn-secondary w-full justify-center">
                  ✏️ Edit Project
                </Link>
                <button
                  onClick={() => setShowDelete(true)}
                  disabled={deleting}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-xl transition-colors border-2 border-red-200 text-sm"
                >
                  🗑️ Delete Project
                </button>
              </div>
            )}

            {/* Teacher Evaluator Sidebar Tools */}
            {isTeacher && (
              <div className="card p-6 space-y-3 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100">
                <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <span>👨‍🏫 Faculty Tools</span>
                </h3>
                <Link
                  to={`/teacher/evaluations/${id}`}
                  className="btn-primary w-full justify-center text-xs py-2.5 shadow-sm"
                >
                  📝 Open Grading Panel
                </Link>
                <Link
                  to="/teacher/pending"
                  className="btn-secondary w-full justify-center text-xs py-2 bg-white"
                >
                  📋 Submissions Queue
                </Link>
                <Link
                  to="/teacher/gradebook"
                  className="btn-secondary w-full justify-center text-xs py-2 bg-white"
                >
                  📗 Open Gradebook
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
