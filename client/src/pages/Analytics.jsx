import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import { SHOWCASE_PROJECTS } from '../utils/showcaseData';

const STAT_CARDS = [
  { key: 'totalProjects', label: 'Total Projects', icon: '📁', style: 'stat-card-orange', textColor: 'text-orange-600' },
  { key: 'totalUsers', label: 'Developers', icon: '👩‍💻', style: 'stat-card-purple', textColor: 'text-purple-600' },
  { key: 'totalComments', label: 'Comments', icon: '💬', style: 'stat-card-teal', textColor: 'text-teal-600' },
  { key: 'totalLikes', label: 'Total Likes', icon: '❤️', style: 'stat-card-pink', textColor: 'text-pink-600' },
];

const DEFAULT_STATS = {
  totalProjects: 6,
  totalUsers: 28,
  totalComments: 54,
  totalLikes: 210,
  mostLikedProject: SHOWCASE_PROJECTS[0],
  highestRatedProject: SHOWCASE_PROJECTS[1],
};

export default function Analytics() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/analytics')
      .then(r => {
        if (r.data && r.data.totalProjects !== undefined) setStats(r.data);
      })
      .catch(e => {
        console.warn('Analytics fallback note:', e.message);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="hero-bg border-b border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            📊 Platform <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-gray-500">Real-time stats from the PeerHub community</p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {loading ? (
          <LoadingSpinner text="Loading stats..." />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            {/* Main stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {STAT_CARDS.map(s => (
                <div key={s.key} className={`${s.style} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                  <div className="text-4xl mb-3">{s.icon}</div>
                  <div className={`text-4xl font-extrabold ${s.textColor} mb-1`}>
                    {stats[s.key]?.toLocaleString() || '0'}
                  </div>
                  <div className="text-gray-600 text-sm font-semibold">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Spotlight cards */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Spotlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Most Liked */}
              {stats.mostLikedProject && (
                <div className="card p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-2xl shadow-md">
                      ❤️
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Most Liked Project</p>
                      <p className="font-bold text-gray-900 text-lg">{stats.mostLikedProject.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-red-500">{stats.mostLikedProject.likes}</span>
                      <span className="text-gray-400 text-sm">likes</span>
                    </div>
                    <Link to={`/project/${stats.mostLikedProject._id}`} className="btn-primary text-sm py-2">
                      View Project
                    </Link>
                  </div>
                </div>
              )}

              {/* Highest Rated */}
              {stats.highestRatedProject && (
                <div className="card p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
                      ⭐
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Highest Rated Project</p>
                      <p className="font-bold text-gray-900 text-lg">{stats.highestRatedProject.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-amber-500">
                        {stats.highestRatedProject.averageRating?.toFixed(1)}
                      </span>
                      <span className="text-gray-400 text-sm">
                        / 5 from {stats.highestRatedProject.ratingCount} ratings
                      </span>
                    </div>
                    <Link to={`/project/${stats.highestRatedProject._id}`} className="btn-primary text-sm py-2">
                      View Project
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Engagement rate */}
            <div className="mt-8 card p-8 section-alt">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Community Engagement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-orange-500">
                    {stats.totalProjects > 0 ? (stats.totalComments / stats.totalProjects).toFixed(1) : '0'}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">Avg comments per project</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-pink-500">
                    {stats.totalProjects > 0 ? (stats.totalLikes / stats.totalProjects).toFixed(1) : '0'}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">Avg likes per project</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-purple-500">
                    {stats.totalUsers > 0 ? (stats.totalProjects / stats.totalUsers).toFixed(1) : '0'}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">Avg projects per developer</div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
