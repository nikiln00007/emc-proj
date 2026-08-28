import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProjectCard from '../components/ProjectCard';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import api from '../utils/api';
import { getLocalProjects } from '../utils/projectStorage';
import { useAuth } from '../context/AuthContext';

const POPULAR_TAGS = ['All', 'React', 'JavaScript', 'Python', 'Node.js', 'MongoDB', 'AI', 'Java', 'TypeScript', 'Vue', 'Django', 'Flutter'];

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="skeleton h-1.5 w-full mb-5 rounded-full" />
      <div className="skeleton h-6 w-3/4 mb-3" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-5/6 mb-4" />
      <div className="flex gap-2 mb-5">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export default function Home() {
  const { isTeacher } = useAuth();
  const [projects, setProjects] = useState(() => getLocalProjects());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(() => getLocalProjects().length);

  const fetchProjects = useCallback(async (s, t, p) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: p, limit: 9 });
      if (s) params.append('search', s);
      if (t && t !== 'All') params.append('tag', t);
      const { data } = await api.get(`/api/projects?${params}`);
      if (data && Array.isArray(data.projects) && data.projects.length > 0) {
        setProjects(data.projects);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || data.projects.length);
        return;
      }
    } catch (e) {
      console.warn('Backend API connection notice, rendering local/showcase projects:', e.message);
    } finally {
      setLoading(false);
    }

    // Client-side fallback filtering on local combined dataset
    let filtered = getLocalProjects();
    if (s && s.trim()) {
      const query = s.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    if (t && t !== 'All') {
      filtered = filtered.filter(item =>
        item.tags.some(tag => tag.toLowerCase() === t.toLowerCase())
      );
    }

    setProjects(filtered);
    setTotal(filtered.length);
    setTotalPages(Math.ceil(filtered.length / 9) || 1);
  }, []);

  useEffect(() => {
    fetchProjects(search, activeTag, page);
  }, [search, activeTag, page, fetchProjects]);

  const handleSearch = useCallback((q) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleTag = (tag) => {
    setActiveTag(tag);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="hero-bg border-b border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Explore <span className="gradient-text">Projects</span>
          </h1>
          <p className="text-gray-500 mb-8">Discover what the community is building</p>

          {/* Search + Add */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 max-w-xl">
              <SearchBar onSearch={handleSearch} placeholder="Search by title, description, or tag..." />
            </div>
            {isTeacher ? (
              <Link to="/admin" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-md flex-shrink-0">
                📋 Evaluation Panel
              </Link>
            ) : (
              <Link to="/add-project" className="btn-primary flex-shrink-0">
                + Share Project
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Tag filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {POPULAR_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleTag(tag)}
              className={`tag-pill text-sm px-3 py-1.5 transition-all ${
                activeTag === tag
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-gray-400 mb-5">
            {total} project{total !== 1 ? 's' : ''} found
            {search && ` for "${search}"`}
            {activeTag !== 'All' && ` tagged "${activeTag}"`}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 mb-6">
            <p className="font-semibold">Failed to load projects</p>
            <p className="text-sm mt-1">{error}</p>
            <button onClick={() => fetchProjects(search, activeTag, page)} className="btn-secondary text-sm mt-3">
              Try again
            </button>
          </div>
        )}

        {/* Project grid */}
        {loading ? (
          <div className="projects-grid">
            {Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No projects found"
            message={search || activeTag !== 'All'
              ? "Try a different search or remove the tag filter."
              : "Be the first to share a project with the community!"}
            ctaLabel="Share Your Project"
            ctaTo="/add-project"
          />
        ) : (
          <div className="projects-grid">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                      page === pageNum
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
