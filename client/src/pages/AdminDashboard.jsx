import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getLocalProjects, getEvaluationsMap, saveProjectEvaluation } from '../utils/projectStorage';

const RUBRIC_CRITERIA = [
  { key: 'codeQuality', label: 'Code Quality & Architecture', max: 25, desc: 'Clean structure, modularity, state management, and error handling.' },
  { key: 'uiUx', label: 'UI/UX & Responsiveness', max: 25, desc: 'Design polish, typography, accessibility, and mobile layout.' },
  { key: 'innovation', label: 'Innovation & Features', max: 25, desc: 'Uniqueness of idea, technical complexity, and feature execution.' },
  { key: 'documentation', label: 'Documentation & Git', max: 25, desc: 'Clear README, commit history, and setup instructions.' },
];

function GradeBadge({ grade, score }) {
  const colors = {
    'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'A': 'bg-green-100 text-green-800 border-green-300',
    'A-': 'bg-teal-100 text-teal-800 border-teal-300',
    'B+': 'bg-blue-100 text-blue-800 border-blue-300',
    'B': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'C': 'bg-amber-100 text-amber-800 border-amber-300',
    'F': 'bg-red-100 text-red-800 border-red-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors[grade] || 'bg-gray-100 text-gray-800'}`}>
      <span>⭐ {grade}</span>
      <span>({score}/100)</span>
    </span>
  );
}

function EvaluateModal({ project, existingEval, onClose, onSave }) {
  const { currentUser } = useAuth();
  const [scores, setScores] = useState({
    codeQuality: existingEval?.scores?.codeQuality ?? 20,
    uiUx: existingEval?.scores?.uiUx ?? 20,
    innovation: existingEval?.scores?.innovation ?? 20,
    documentation: existingEval?.scores?.documentation ?? 20,
  });
  const [feedback, setFeedback] = useState(existingEval?.feedback || '');
  const [evaluatorName, setEvaluatorName] = useState(existingEval?.evaluatorName || currentUser?.displayName || 'Prof. Anderson (Lead Evaluator)');

  const total = Number(scores.codeQuality) + Number(scores.uiUx) + Number(scores.innovation) + Number(scores.documentation);

  const handleScoreChange = (key, val) => {
    const num = Math.min(25, Math.max(0, Number(val) || 0));
    setScores(prev => ({ ...prev, [key]: num }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const result = saveProjectEvaluation(project._id, {
      evaluatorName,
      scores,
      feedback,
    });
    onSave(result);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Official Evaluation Rubric</span>
            <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{project.title}</h2>
            <p className="text-xs text-gray-400">Student: <span className="font-semibold text-gray-700">{project.owner?.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 text-lg">✕</button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Rubric Matrix */}
          <div className="space-y-4">
            {RUBRIC_CRITERIA.map(c => (
              <div key={c.key} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-sm text-gray-800">{c.label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="25"
                      value={scores[c.key]}
                      onChange={e => handleScoreChange(c.key, e.target.value)}
                      className="w-16 text-center font-bold text-sm bg-white border border-gray-300 rounded-lg py-1 px-2 focus:border-orange-500 outline-none"
                    />
                    <span className="text-xs font-semibold text-gray-400">/ 25</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{c.desc}</p>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={scores[c.key]}
                  onChange={e => handleScoreChange(c.key, e.target.value)}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Total & Grade display */}
          <div className="bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 p-5 rounded-2xl border border-orange-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Grade</p>
              <p className="text-2xl font-black text-gray-900">
                {total} <span className="text-sm font-semibold text-gray-400">/ 100</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Status</span>
              <GradeBadge grade={total >= 95 ? 'A+' : total >= 90 ? 'A' : total >= 80 ? 'B+' : total >= 70 ? 'B' : 'C'} score={total} />
            </div>
          </div>

          {/* Teacher Feedback */}
          <div>
            <label className="form-label">Teacher Evaluation Remarks & Suggestions *</label>
            <textarea
              className="form-input resize-none h-24"
              placeholder="Provide constructive feedback on what the student excelled at and areas for improvement..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Evaluator / Judge Name</label>
            <input
              className="form-input"
              value={evaluatorName}
              onChange={e => setEvaluatorName(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center py-3">
              💾 Submit Grade & Marks
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-6 py-3">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { isTeacher, switchRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'evaluated' | 'leaderboard'
  const [search, setSearch] = useState('');
  const [activeProjectForEval, setActiveProjectForEval] = useState(null);

  const refreshData = () => {
    const list = getLocalProjects();
    setProjects(list);
    setEvaluations(getEvaluationsMap());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const totalCount = projects.length;
  const evaluatedCount = Object.keys(evaluations).length;
  const pendingCount = Math.max(0, totalCount - evaluatedCount);
  const avgScore = evaluatedCount > 0
    ? (Object.values(evaluations).reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / evaluatedCount).toFixed(1)
    : '0';

  const filteredProjects = projects.filter(p => {
    const isEvaluated = Boolean(evaluations[p._id]);
    if (filter === 'pending' && isEvaluated) return false;
    if (filter === 'evaluated' && !isEvaluated) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.owner?.name?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sort by score for leaderboard
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (filter === 'leaderboard') {
      const scoreA = evaluations[a._id]?.totalScore || 0;
      const scoreB = evaluations[b._id]?.totalScore || 0;
      return scoreB - scoreA;
    }
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />

      {activeProjectForEval && (
        <EvaluateModal
          project={activeProjectForEval}
          existingEval={evaluations[activeProjectForEval._id]}
          onClose={() => setActiveProjectForEval(null)}
          onSave={() => {
            refreshData();
            setActiveProjectForEval(null);
          }}
        />
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white py-12 px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <span>👨‍🏫 Faculty & Evaluator Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Project Evaluation & Grading Hub
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Review submitted student projects, evaluate against rubric criteria, and assign marks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isTeacher && (
              <button
                onClick={() => switchRole('teacher')}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <span>🔑 Switch to Teacher Mode</span>
              </button>
            )}
            <span className="text-xs bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1.5 rounded-xl font-medium">
              Academic Term 2026
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Submissions', val: totalCount, icon: '📁', bg: 'bg-white border-gray-200' },
            { label: 'Evaluated Projects', val: evaluatedCount, icon: '✅', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
            { label: 'Pending Review', val: pendingCount, icon: '⏳', bg: 'bg-amber-50 border-amber-200 text-amber-800' },
            { label: 'Average Score', val: `${avgScore} / 100`, icon: '📊', bg: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
          ].map((m, i) => (
            <div key={i} className={`p-5 rounded-2xl border shadow-sm ${m.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{m.label}</span>
                <span className="text-xl">{m.icon}</span>
              </div>
              <div className="text-2xl font-extrabold">{m.val}</div>
            </div>
          ))}
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="card p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { key: 'all', label: `All Projects (${totalCount})` },
              { key: 'pending', label: `Needs Evaluation (${pendingCount})` },
              { key: 'evaluated', label: `Evaluated (${evaluatedCount})` },
              { key: 'leaderboard', label: `🏆 Leaderboard Rankings` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === tab.key
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <input
              type="search"
              placeholder="Search by project or student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input text-xs py-2"
            />
          </div>
        </div>

        {/* Project Table / Cards */}
        <div className="space-y-4">
          {sortedProjects.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-3">📋</div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">No submissions found</h3>
              <p className="text-gray-500 text-xs">Try switching filters or search terms.</p>
            </div>
          ) : (
            sortedProjects.map((p, index) => {
              const evalData = evaluations[p._id];
              return (
                <div
                  key={p._id}
                  className="card p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-orange-200"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {filter === 'leaderboard' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 mt-1 ${
                        index === 0 ? 'bg-amber-400 text-white shadow-md' : index === 1 ? 'bg-gray-300 text-gray-800' : index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        #{index + 1}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-gray-900 text-base leading-snug">
                          {p.title}
                        </h3>
                        {evalData ? (
                          <GradeBadge grade={evalData.grade} score={evalData.totalScore} />
                        ) : (
                          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                            ⏳ Pending Review
                          </span>
                        )}
                      </div>

                      <p className="text-gray-500 text-xs line-clamp-2 mb-2">{p.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="font-medium text-gray-700">Student: <strong>{p.owner?.name}</strong></span>
                        <span>•</span>
                        <div className="flex gap-1">
                          {p.tags?.slice(0, 3).map(t => (
                            <span key={t} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold">{t}</span>
                          ))}
                        </div>
                      </div>

                      {evalData && (
                        <div className="mt-3 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">💬 Feedback:</span>
                          <span className="italic">{evalData.feedback}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost text-xs py-2 px-3 border border-gray-200 bg-white"
                    >
                      GitHub ↗
                    </a>
                    <Link
                      to={`/project/${p._id}`}
                      className="btn-secondary text-xs py-2 px-3"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => setActiveProjectForEval(p)}
                      className="btn-primary text-xs py-2 px-4 whitespace-nowrap shadow-sm"
                    >
                      {evalData ? '✏️ Edit Marks' : '📝 Grade & Evaluate'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
