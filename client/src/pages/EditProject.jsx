import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getLocalProjectById, updateLocalProject } from '../utils/projectStorage';

export default function EditProject() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', description: '', tags: '', githubUrl: '', liveDemoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const localP = getLocalProjectById(id);
    if (localP) {
      setForm({
        title: localP.title,
        description: localP.description,
        tags: localP.tags?.join(', ') || '',
        githubUrl: localP.githubUrl,
        liveDemoUrl: localP.liveDemoUrl || '',
      });
      setLoading(false);
    }

    api.get(`/api/projects/${id}`)
      .then(r => {
        const p = r.data;
        if (p) {
          setForm({
            title: p.title,
            description: p.description,
            tags: p.tags?.join(', ') || '',
            githubUrl: p.githubUrl,
            liveDemoUrl: p.liveDemoUrl || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, currentUser, navigate]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.tags.trim() || !form.githubUrl.trim()) {
      return setError('Title, description, tags, and GitHub URL are required.');
    }
    setSaving(true);
    setError('');

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    try {
      await api.put(`/api/projects/${id}`, { ...form, tags });
    } catch {}

    updateLocalProject(id, { ...form, tags });
    navigate(`/project/${id}`);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col"><Navbar /><LoadingSpinner text="Loading project..." /></div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="mb-10">
          <Link to={`/project/${id}`} className="text-sm text-gray-400 hover:text-orange-500 transition-colors mb-4 inline-block">
            ← Back to Project
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Edit Project</h1>
          <p className="text-gray-500">Update your project details</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <span className="text-red-500">⚠</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label" htmlFor="title">Project Title *</label>
              <input id="title" name="title" type="text" className="form-input" value={form.title} onChange={handleChange} required maxLength={100} />
            </div>
            <div>
              <label className="form-label" htmlFor="description">Description *</label>
              <textarea id="description" name="description" className="form-input resize-none h-36" value={form.description} onChange={handleChange} required maxLength={2000} />
            </div>
            <div>
              <label className="form-label" htmlFor="tags">Tags * <span className="font-normal text-gray-400">(comma-separated)</span></label>
              <input id="tags" name="tags" type="text" className="form-input" value={form.tags} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label" htmlFor="githubUrl">GitHub URL *</label>
              <input id="githubUrl" name="githubUrl" type="url" className="form-input" value={form.githubUrl} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label" htmlFor="liveDemoUrl">Live Demo URL <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="liveDemoUrl" name="liveDemoUrl" type="url" className="form-input" value={form.liveDemoUrl} onChange={handleChange} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1 justify-center py-3" disabled={saving}>
                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>) : '💾 Save Changes'}
              </button>
              <Link to={`/project/${id}`} className="btn-secondary flex-1 justify-center py-3">Cancel</Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
