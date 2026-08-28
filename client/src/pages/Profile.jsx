import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getLocalProjects } from '../utils/projectStorage';

export default function Profile() {
  const { uid } = useParams();
  const { currentUser, dbUser, setDbUser } = useAuth();
  const isOwner = currentUser?.uid === uid || (!currentUser && uid === 'dev-user') || (currentUser && !uid);

  const [user, setUser] = useState(() => isOwner ? (dbUser || currentUser) : null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', profileImage: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    // 1. Check local storage / showcase user
    const all = getLocalProjects();
    const userProj = all.filter(p => p.owner?.firebaseUid === uid || (isOwner && (p.owner?.firebaseUid === currentUser?.uid || p.owner?.firebaseUid === 'dev-user')));
    setProjects(userProj);

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
          setProjects(pRes.data.projects);
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

  const joinDate = user ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  const initials = (user?.name || 'A')[0].toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

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
          <div className="card p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 flex items-center justify-center text-white text-4xl font-black shadow-lg">
                  {initials}
                </div>
              )}

              <div className="flex-1">
                {!editing ? (
                  <>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{user.name}</h1>
                    <p className="text-gray-400 text-sm mb-3">{user.email}</p>
                    {user.bio && <p className="text-gray-600 leading-relaxed mb-3">{user.bio}</p>}
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
                  <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2">✏️ Edit Profile</button>
                )}
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Projects', value: projects.length, color: 'text-orange-500' },
                    { label: 'Likes', value: totalLikes, color: 'text-red-500' },
                    { label: 'Comments', value: '—', color: 'text-purple-500' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400 font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Projects */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isOwner ? 'My Projects' : `${user.name}'s Projects`}
          </h2>

          {projects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No projects yet"
              message={isOwner ? "You haven't published any projects yet." : `${user.name} hasn't published any projects yet.`}
              ctaLabel={isOwner ? "Create Your First Project" : undefined}
              ctaTo={isOwner ? "/add-project" : undefined}
            />
          ) : (
            <div className="projects-grid">
              {projects.map(p => <ProjectCard key={p._id} project={p} />)}
            </div>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
