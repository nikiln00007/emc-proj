import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { SHOWCASE_PROJECTS } from '../utils/showcaseData';

const FEATURES = [
  {
    icon: '🚀',
    title: 'Share Projects',
    desc: 'Publish your coding projects with GitHub links, live demos, and detailed descriptions.',
    color: 'stat-card-orange',
  },
  {
    icon: '🔍',
    title: 'Discover Ideas',
    desc: 'Explore a curated feed of projects across all tech stacks. Find your next inspiration.',
    color: 'stat-card-purple',
  },
  {
    icon: '💬',
    title: 'Get Feedback',
    desc: 'Receive genuine comments, ratings, and likes from your peers to grow as a developer.',
    color: 'stat-card-teal',
  },
  {
    icon: '🏆',
    title: 'Build Portfolio',
    desc: 'Your public profile showcases everything you\'ve built. Share it with recruiters.',
    color: 'stat-card-pink',
  },
];

const STEPS = [
  { n: '01', title: 'Create an account', desc: 'Sign up in seconds using your email. No credit card required.' },
  { n: '02', title: 'Upload your project', desc: 'Add your GitHub repo, a description, tags, and optionally a live demo link.' },
  { n: '03', title: 'Get discovered', desc: 'Your project appears in the community feed and is searchable by tech stack.' },
  { n: '04', title: 'Learn & collaborate', desc: 'Receive feedback, rate others\' work, and build a track record of contributions.' },
];

export default function Landing() {
  const [stats, setStats] = useState({ totalProjects: 12, totalUsers: 48, totalComments: 86, totalLikes: 142 });
  const [featured, setFeatured] = useState(SHOWCASE_PROJECTS.slice(0, 3));

  useEffect(() => {
    api.get('/api/analytics').then(r => {
      if (r.data && r.data.totalProjects !== undefined) setStats(r.data);
    }).catch(() => {});
    api.get('/api/projects?limit=3').then(r => {
      if (r.data && Array.isArray(r.data.projects) && r.data.projects.length > 0) {
        setFeatured(r.data.projects);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero-bg py-24 md:py-36 px-4 text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-orange-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-100 rounded-full opacity-20 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 fade-in">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            Open to all developers — Join the community
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 fade-in-delay-1">
            Build. Share.<br />
            <span className="gradient-text">Discover. Learn.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed fade-in-delay-2">
            A community where developers showcase their coding projects,
            discover new ideas, and learn from each other.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 fade-in-delay-3">
            <Link to="/home" className="btn-primary text-base px-7 py-3">
              Explore Projects ↗
            </Link>
            <Link to="/signup" className="btn-secondary text-base px-7 py-3">
              Share Your Project
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live Stats Bar ─────────────────────────────────────── */}
      {stats && (
        <section className="bg-gray-900 py-8 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Projects', value: stats.totalProjects, icon: '📁' },
              { label: 'Developers', value: stats.totalUsers, icon: '👩‍💻' },
              { label: 'Comments', value: stats.totalComments, icon: '💬' },
              { label: 'Total Likes', value: stats.totalLikes, icon: '❤️' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-3xl font-extrabold text-white">{s.value?.toLocaleString() || '0'}</div>
                <div className="text-gray-400 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Everything you need to <span className="gradient-text-warm">grow as a developer</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              PeerHub gives you the tools to showcase your work and connect with a community that cares about building.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className={`${f.color} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl`}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="section-alt py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-500 text-lg">Get started in minutes. No complicated setup.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-orange-200 to-transparent" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-white text-xl font-black mb-4 shadow-lg">
                  {s.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Projects ─────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Latest Projects</h2>
                <p className="text-gray-500">Fresh projects from the community</p>
              </div>
              <Link to="/home" className="btn-secondary hidden sm:flex">View all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(p => {
                const tags = p.tags?.slice(0, 3) || [];
                return (
                  <Link key={p._id} to={`/project/${p._id}`} className="card p-5 block hover:border-orange-200">
                    <div className="h-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{p.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{p.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(t => (
                        <span key={t} className="tag-pill bg-orange-50 text-orange-600">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-600">{p.owner?.name}</span>
                      <span className="text-sm text-gray-400">❤️ {p.likes}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <Link to="/home" className="btn-secondary">View all projects →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Tech Stack Banner ─────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm font-semibold mb-6 uppercase tracking-widest">Built with</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-500 font-semibold text-sm">
            {['React', 'Node.js', 'MongoDB', 'Express', 'Firebase', 'Tailwind CSS'].map(t => (
              <span key={t} className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Start sharing your projects today
          </h2>
          <p className="text-orange-100 text-lg mb-10 max-w-xl mx-auto">
            Join hundreds of developers already showcasing their work and getting valuable feedback.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup" className="bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-base">
              Get Started — Free
            </Link>
            <Link to="/home" className="border-2 border-white/50 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-base">
              Browse Projects
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
