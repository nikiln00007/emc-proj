import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const SUGGESTED_TAGS = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Django', 'MongoDB', 'PostgreSQL', 'TypeScript', 'JavaScript', 'Flutter', 'Firebase', 'AI', 'Machine Learning', 'Java', 'Spring Boot'];

export default function AddProject() {
  const { dbUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', tags: '', githubUrl: '', liveDemoUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const addTag = (tag) => {
    const existing = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (!existing.includes(tag)) {
      setForm(p => ({ ...p, tags: [...existing, tag].join(', ') }));
    }
  };

  const validate = () => {
    if (!form.title.trim()) return 'Project title is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.tags.trim()) return 'At least one tag is required.';
    if (!form.githubUrl.trim()) return 'GitHub URL is required.';
    try { new URL(form.githubUrl); } catch { return 'Please enter a valid GitHub URL.'; }
    if (form.liveDemoUrl) {
      try { new URL(form.liveDemoUrl); } catch { return 'Please enter a valid live demo URL.'; }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { data } = await api.post('/api/projects', {
        ...form,
        tags,
        ownerName: dbUser?.name || 'Anonymous',
      });
      if (data && data._id) {
        navigate(`/project/${data._id}`);
        return;
      }
    } catch (e) {
      console.warn('Backend save notice, saving locally:', e.message);
    } finally {
      setLoading(false);
    }

    // Fallback local save
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const newId = 'proj-user-' + Date.now();
    const newProject = {
      _id: newId,
      title: form.title,
      description: form.description,
      tags,
      githubUrl: form.githubUrl,
      liveDemoUrl: form.liveDemoUrl || '',
      owner: {
        firebaseUid: dbUser?.firebaseUid || 'dev-user',
        name: dbUser?.name || 'Developer',
        profileImage: dbUser?.profileImage || '',
      },
      likes: 0,
      likedBy: [],
      bookmarkedBy: [],
      averageRating: 0,
      ratingCount: 0,
      ratings: [],
      createdAt: new Date().toISOString(),
    };

    const userProjects = JSON.parse(localStorage.getItem('peerhub_user_projects') || '[]');
    userProjects.unshift(newProject);
    localStorage.setItem('peerhub_user_projects', JSON.stringify(userProjects));

    navigate(`/project/${newId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link to="/my-projects" className="text-sm text-gray-400 hover:text-orange-500 transition-colors mb-4 inline-block">
            ← Back to My Projects
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Share Your Project</h1>
          <p className="text-gray-500">Publish your work to the PeerHub community</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <span className="text-red-500 flex-shrink-0">⚠</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label" htmlFor="title">Project Title *</label>
              <input id="title" name="title" type="text" className="form-input" placeholder="My Awesome Project" value={form.title} onChange={handleChange} required maxLength={100} />
              <p className="text-xs text-gray-400 mt-1">{form.title.length}/100</p>
            </div>

            <div>
              <label className="form-label" htmlFor="description">Description *</label>
              <textarea id="description" name="description" className="form-input resize-none h-36" placeholder="Describe what your project does, what problems it solves, and what you learned..." value={form.description} onChange={handleChange} required maxLength={2000} />
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
            </div>

            <div>
              <label className="form-label" htmlFor="tags">Tags * <span className="font-normal text-gray-400">(comma-separated)</span></label>
              <input id="tags" name="tags" type="text" className="form-input" placeholder="React, Node.js, MongoDB" value={form.tags} onChange={handleChange} required />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTED_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="tag-pill bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="githubUrl">GitHub Repository URL *</label>
              <input id="githubUrl" name="githubUrl" type="url" className="form-input" placeholder="https://github.com/username/repo" value={form.githubUrl} onChange={handleChange} required />
            </div>

            <div>
              <label className="form-label" htmlFor="liveDemoUrl">Live Demo URL <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="liveDemoUrl" name="liveDemoUrl" type="url" className="form-input" placeholder="https://my-project.vercel.app" value={form.liveDemoUrl} onChange={handleChange} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1 justify-center py-3" disabled={loading}>
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publishing...</>
                ) : '🚀 Publish Project'}
              </button>
              <Link to="/my-projects" className="btn-secondary flex-1 justify-center py-3">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
