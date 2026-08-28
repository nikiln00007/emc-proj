import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getLocalProjects, deleteLocalProject } from '../utils/projectStorage';

const TAG_COLORS = ['bg-orange-100 text-orange-700', 'bg-purple-100 text-purple-700', 'bg-teal-100 text-teal-700', 'bg-pink-100 text-pink-700'];
const tagColor = (t) => { let h=0; for(let i=0;i<t.length;i++) h=t.charCodeAt(i)+((h<<5)-h); return TAG_COLORS[Math.abs(h)%4]; };

function ConfirmModal({ title, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <div className="text-4xl text-center mb-4">🗑️</div>
        <h2 className="text-xl font-bold text-center mb-2">Delete Project?</h2>
        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
          "<span className="font-semibold text-gray-700">{title}</span>" will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function MyProjects() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadProjects = () => {
    setLoading(true);
    const all = getLocalProjects();
    const my = all.filter(p => p.owner?.firebaseUid === currentUser?.uid || p.owner?.firebaseUid === 'dev-user');
    setProjects(my);
    setLoading(false);

    api.get(`/api/projects?owner=${currentUser?.uid}&limit=50`)
      .then(r => {
        if (r.data && Array.isArray(r.data.projects) && r.data.projects.length > 0) {
          setProjects(r.data.projects);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadProjects();
  }, [currentUser]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/projects/${deleteTarget._id}`);
    } catch {}
    deleteLocalProject(deleteTarget._id);
    setProjects(prev => prev.filter(p => p._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {deleteTarget && <ConfirmModal title={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      <div className="hero-bg border-b border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">My Projects</h1>
            <p className="text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''} published</p>
          </div>
          <Link to="/add-project" className="btn-primary">+ New Project</Link>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        {loading ? <LoadingSpinner text="Loading your projects..." /> : projects.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No projects yet"
            message="Share your first project and join the PeerHub community!"
            ctaLabel="Create Your First Project"
            ctaTo="/add-project"
          />
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <div key={p._id} className="card flex flex-col">
                <div className="h-1.5 rounded-t-[1.25rem] bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400" />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{p.title}</h3>
                    {p.evaluationStatus && p.evaluationStatus !== 'not_submitted' && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        p.evaluationStatus === 'graded'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : p.evaluationStatus === 'needs_revision'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {p.evaluationStatus === 'graded' ? '✅ Graded' : p.evaluationStatus === 'needs_revision' ? '🔄 Needs Revision' : '⏳ In Review'}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3 flex-1">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.tags?.slice(0, 3).map(t => (
                      <span key={t} className={`tag-pill ${tagColor(t)}`}>{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mb-4 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1"><span className="text-red-400">♥</span> {p.likes || 0}</span>
                    {p.ratingCount > 0 && <span>⭐ {p.averageRating?.toFixed(1)}</span>}
                    <span className="ml-auto text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/project/${p._id}`} className="btn-ghost text-xs py-1.5 flex-1 justify-center bg-gray-50">View</Link>
                    <Link to={`/edit-project/${p._id}`} className="btn-secondary text-xs py-1.5 flex-1 justify-center">Edit</Link>
                    <button onClick={() => setDeleteTarget(p)} className="text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors border border-red-200 flex-1">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
