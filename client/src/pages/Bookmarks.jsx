import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getLocalProjects } from '../utils/projectStorage';

export default function Bookmarks() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const all = getLocalProjects();
    const bookmarkedList = JSON.parse(localStorage.getItem('peerhub_bookmarks_' + currentUser?.uid) || '[]');
    const myBookmarks = all.filter(p => p.bookmarkedBy?.includes(currentUser?.uid) || bookmarkedList.includes(p._id));
    setProjects(myBookmarks);
    setLoading(false);

    api.get('/api/projects/bookmarks')
      .then(r => {
        if (r.data && Array.isArray(r.data.projects) && r.data.projects.length > 0) {
          setProjects(r.data.projects);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="hero-bg border-b border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            🔖 Bookmarks
          </h1>
          <p className="text-gray-500">{projects.length} saved project{projects.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        {loading ? (
          <LoadingSpinner text="Loading bookmarks..." />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="📌"
            title="No bookmarks yet"
            message="Browse the community feed and bookmark projects you'd like to revisit."
            ctaLabel="Explore Projects"
            ctaTo="/home"
          />
        ) : (
          <div className="projects-grid">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
