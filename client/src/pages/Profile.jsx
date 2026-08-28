import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/teacher/StatusBadge';
import GradePill from '../components/teacher/GradePill';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getLocalProjects, getProjectEvaluation } from '../utils/projectStorage';

const TAG_COLORS = [
  'bg-orange-100 text-orange-700', 'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700', 'bg-pink-100 text-pink-700',
  'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
];
const tagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

export default function Profile() {
  const { uid } = useParams();
  const { currentUser, dbUser, setDbUser, isTeacher } = useAuth();
  const isOwner = currentUser?.uid === uid || (!currentUser && uid === 'dev-user') || (currentUser && !uid);

  const [user, setUser] = useState(() => isOwner ? (dbUser || currentUser) : null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', profileImage: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [submitToast, setSubmitToast] = useState('');

  useEffect(() => {
    // 1. Check local storage / showcase user
    const all = getLocalProjects();
    const userProj = all.filter(p => p.owner?.firebaseUid === uid || (isOwner && (p.owner?.firebaseUid === currentUser?.uid || p.owner?.firebaseUid === 'dev-user')));
    
    // Enrich with evaluations from storage
    const enriched = userProj.map(p => {
      const ev = getProjectEvaluation(p._id);
      return ev ? { ...p, evaluation: ev, evaluationStatus: ev.status || (ev.grade ? 'graded' : p.evaluationStatus) } : p;
    });
    setProjects(enriched);

    if (isOwner && (dbUser || currentUser)) {
      const activeUser = dbUser || currentUser;
      setUser(activeUser);
      setEditForm({
        name: activeUser.name || activeUser.displayName || 'Developer',
        bio: activeUser.bio || 'Student Developer & Builder at PeerHub',
        profileImage: activeUser.profileImage || activeUser.photoURL || '',
      });
    } else if (userProj.length > 0 && userProj[0].owner) {
      setUser({
        firebaseUid: uid,
        name: userProj[0].owner.name,
        profileImage: userProj[0].owner.profileImage,
        bio: 'Student Developer at PeerHub',
        createdAt: userProj[0].createdAt,
      });
    }

    // 2. Try fetching from backend
    api.get(`/api/users/${uid}`)
      .then(uRes => {
        if (uRes.data) {
          setUser(uRes.data);
          setEditForm({ name: uRes.data.name, bio: uRes.data.bio || '', profileImage: uRes.data.profileImage || '' });
        }
      })
      .catch(() => {});

    api.get(`/api/projects?owner=${uid}&limit=50`)
      .then(pRes => {
        if (pRes.data && Array.isArray(pRes.data.projects) && pRes.data.projects.length > 0) {
          const apiEnriched = pRes.data.projects.map(p => {
            const ev = p.evaluation || getProjectEvaluation(p._id);
            return ev ? { ...p, evaluation: ev, evaluationStatus: p.evaluationStatus || ev.status } : p;
          });
          setProjects(apiEnriched);
        }
      })
      .catch(() => {});
  }, [uid, isOwner, dbUser, currentUser]);

  const totalLikes = projects.reduce((sum, p) => sum + (p.likes || 0), 0);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return setSaveError('Name is required.');
    setSaving(true);
    setSaveError('');

    try {
      const { data } = await api.put(`/api/users/${uid}`, editForm);
      if (data) {
        setUser(data);
        setDbUser(data);
      }
    } catch {}

    const updated = {
      ...(user || {}),
      name: editForm.name,
      displayName: editForm.name,
      bio: editForm.bio,
      profileImage: editForm.profileImage,
      photoURL: editForm.profileImage,
    };
    setUser(updated);
    setDbUser(updated);

    const saved = localStorage.getItem('peerhub_active_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      localStorage.setItem('peerhub_active_user', JSON.stringify({
        ...parsed,
        displayName: editForm.name,
        photoURL: editForm.profileImage,
        bio: editForm.bio,
      }));
    }

    setEditing(false);
    setSaving(false);
  };

  const handleQuickSubmit = async (projectId) => {
    try {
      await api.post(`/api/projects/${projectId}/submit-for-evaluation`);
    } catch {}
    setProjects(prev => prev.map(p => p._id === projectId ? { ...p, isSubmittedForEvaluation: true, evaluationStatus: 'pending' } : p));
    setSubmitToast('✅ Submitted project for faculty review!');
    setTimeout(() => setSubmitToast(''), 3500);
  };

  const joinDate = user ? new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  const initials = (user?.name || 'A')[0].toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />

      {submitToast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl">
          {submitToast}
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" text="Loading profile..." />
      ) : !user ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-500 mb-6">This user hasn't set up their profile yet.</p>
          <Link to="/home" className="btn-primary">Back to Explore</Link>
        </div>
      ) : (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
          {/* Profile header */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-orange-100" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 flex items-center justify-center text-white text-4xl font-black shadow-md">
                  {initials}
                </div>
              )}

              <div className="flex-1">
                {!editing ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-3xl font-extrabold text-gray-900">{user.name}</h1>
                      {user.role === 'teacher' || user.role === 'admin' ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          👨‍🏫 Faculty
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                          🎓 Student
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{user.email}</p>
                    {user.bio && <p className="text-gray-600 leading-relaxed mb-2 text-sm">{user.bio}</p>}
                    <p className="text-xs text-gray-400">Joined {joinDate}</p>
                  </>
                ) : (
                  <form onSubmit={handleSave} className="space-y-4 max-w-md">
                    {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
                    <div>
                      <label className="form-label" htmlFor="eName">Name</label>
                      <input id="eName" className="form-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="eBio">Bio</label>
                      <textarea id="eBio" className="form-input resize-none h-20" placeholder="Tell the community about yourself..." value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} maxLength={300} />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="eImg">Profile Image URL</label>
                      <input id="eImg" type="url" className="form-input" placeholder="https://..." value={editForm.profileImage} onChange={e => setEditForm(p => ({ ...p, profileImage: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary text-sm py-2" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                      <button type="button" className="btn-secondary text-sm py-2" onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Stats + Edit button */}
              <div className="flex flex-col items-end gap-4">
                {isOwner && !editing && (
                  <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2 shadow-sm">
                    ✏️ Edit Profile
                  </button>
                )}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Projects', value: projects.length, color: 'text-orange-600' },
                    { label: 'Likes', value: totalLikes, color: 'text-red-500' },
                    { label: 'Evaluated', value: projects.filter(p => p.evaluationStatus === 'graded' || p.evaluation?.grade).length, color: 'text-emerald-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3 min-w-[70px]">
                      <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-[11px] text-gray-400 font-semibold">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {isOwner ? 'My Projects & Evaluations' : `${user.name}'s Submissions`}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isOwner
                  ? 'Track your project status, grades, and faculty review feedback.'
                  : 'Review submitted student projects and evaluate rubric marks.'}
              </p>
            </div>
            {isOwner && (
              <Link to="/add-project" className="btn-primary text-xs py-2 px-4 shadow-sm">
                + New Project
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No projects yet"
              message={isOwner ? "You haven't published any projects yet." : `${user.name} hasn't published any projects yet.`}
              ctaLabel={isOwner ? "Create Your First Project" : undefined}
              ctaTo={isOwner ? "/add-project" : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => {
                const ev = p.evaluation || getProjectEvaluation(p._id);
                const isGraded = p.evaluationStatus === 'graded' || (ev && (ev.grade !== undefined || ev.totalScore !== undefined));
                const gradeValue = ev?.grade ?? (ev?.totalScore ? (ev.totalScore / 10).toFixed(1) : null);
                const letterGrade = ev?.letterGrade || ev?.grade;

                return (
                  <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-all">
                    {/* Top color bar */}
                    <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400" />

                    <div className="p-5 flex flex-col flex-1">
                      {/* Header with Title & Status Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-1">
                          {p.title}
                        </h3>
                        {isGraded ? (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                            ✅ Graded
                          </span>
                        ) : p.evaluationStatus && p.evaluationStatus !== 'not_submitted' ? (
                          <StatusBadge status={p.evaluationStatus} size="sm" />
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                            📝 Not Submitted
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                        {p.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {p.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className={`tag-pill text-[11px] py-0.5 px-2 ${tagColor(tag)}`}>{tag}</span>
                        ))}
                      </div>

                      {/* ── Official Evaluation Result Card (if graded) ── */}
                      {isGraded && (
                        <div className="mb-4 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                              <span>🏆 Grade:</span>
                            </span>
                            <GradePill grade={gradeValue} letterGrade={letterGrade} size="sm" />
                          </div>
                          {ev?.feedback && (
                            <p className="text-[11px] text-emerald-800 italic line-clamp-2 mt-1 bg-white/80 rounded-lg p-1.5 border border-emerald-100">
                              💬 "{ev.feedback}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── Status note if in review / not submitted ── */}
                      {!isGraded && p.isSubmittedForEvaluation && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800 font-medium">
                          ⏳ In Faculty Review Queue
                        </div>
                      )}

                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        {/* Student owner actions: View and Edit */}
                        {isOwner && !isTeacher && (
                          <div className="flex items-center gap-2 w-full">
                            <Link
                              to={`/project/${p._id}`}
                              className="btn-ghost text-xs py-1.5 px-3 flex-1 justify-center bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-xl"
                            >
                              View →
                            </Link>
                            <Link
                              to={`/edit-project/${p._id}`}
                              className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center rounded-xl"
                            >
                              ✏️ Edit
                            </Link>
                            {!p.isSubmittedForEvaluation && !isGraded && (
                              <button
                                onClick={() => handleQuickSubmit(p._id)}
                                className="text-[11px] font-bold bg-orange-500 hover:bg-orange-600 text-white py-1.5 px-2.5 rounded-xl transition-colors shadow-sm"
                                title="Submit for faculty review"
                              >
                                🚀 Submit
                              </button>
                            )}
                          </div>
                        )}

                        {/* Teacher evaluator actions: View Details and Evaluate/Grade */}
                        {isTeacher && (
                          <div className="flex items-center gap-2 w-full">
                            <Link
                              to={`/project/${p._id}`}
                              className="btn-ghost text-xs py-1.5 px-3 flex-1 justify-center bg-gray-50 hover:bg-gray-100 rounded-xl"
                            >
                              View
                            </Link>
                            <Link
                              to={`/teacher/evaluations/${p._id}`}
                              className={`text-xs font-bold py-1.5 px-3 rounded-xl flex-1 text-center shadow-sm transition-all ${
                                isGraded
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white'
                              }`}
                            >
                              {isGraded ? '✏️ Edit Marks' : '📝 Evaluate →'}
                            </Link>
                          </div>
                        )}

                        {/* Other student visitor */}
                        {!isOwner && !isTeacher && (
                          <Link
                            to={`/project/${p._id}`}
                            className="btn-primary text-xs py-1.5 px-4 w-full justify-center"
                          >
                            View Project →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
