import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import StatusBadge from '../../components/teacher/StatusBadge';
import GradePill from '../../components/teacher/GradePill';
import api from '../../utils/api';
import { formatWaitTime } from '../../utils/gradeHelpers';

const TAGS = ['All', 'React', 'Node.js', 'Python', 'AI', 'JavaScript', 'TypeScript', 'MongoDB'];

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function PendingReviews() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [tagFilter, setTag]           = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (tagFilter !== 'All') params.set('tag', tagFilter);
      if (search.trim()) params.set('search', search.trim());
      const { data } = await api.get(`/api/teacher/pending?${params.toString()}`);
      setEvaluations(data.evaluations || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter, tagFilter]);

  return (
    <TeacherLayout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200
          text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
          ⏳ Pending Reviews
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Project Evaluation Queue</h1>
        <p className="text-gray-500 text-sm mt-1">
          {evaluations.length} submission{evaluations.length !== 1 ? 's' : ''} awaiting your review
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-3">
        <input
          type="search"
          placeholder="Search by student or project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input text-sm flex-1"
        />
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="form-input text-sm md:w-48"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="needs_revision">Needs Revision</option>
        </select>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                ${tagFilter === t
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >{t}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Student', 'Project', 'Tags', 'Submitted', 'Waiting', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

              {!loading && evaluations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="font-bold text-gray-700">No submissions match your filters</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different status or clear search</p>
                  </td>
                </tr>
              )}

              {!loading && evaluations.map(ev => {
                const student     = ev.student || {};
                const project     = ev.project || {};
                const submittedAt = ev.submittedAt || ev.createdAt;
                const dateStr     = new Date(submittedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });

                return (
                  <tr key={ev._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {student.profileImage || project.owner?.profileImage ? (
                          <img
                            src={student.profileImage || project.owner?.profileImage}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400
                            flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(student.name || project.owner?.name || 'S')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{student.name || project.owner?.name}</p>
                          <p className="text-[10px] text-gray-400">{student.email || ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="font-semibold text-gray-800 text-xs line-clamp-2">{project.title}</p>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {project.tags?.slice(0, 2).map(t => (
                          <span key={t} className="bg-gray-100 text-gray-600 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{dateStr}</td>

                    {/* Waiting */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${ev.waitDays >= 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {formatWaitTime(submittedAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={ev.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/teacher/evaluations/${ev._id}`}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r
                            from-orange-500 to-pink-500 text-white hover:opacity-90 whitespace-nowrap"
                        >
                          Grade →
                        </Link>
                        <Link
                          to={`/project/${project._id}`}
                          className="text-xs font-semibold px-2 py-1.5 rounded-xl border border-gray-200
                            text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </TeacherLayout>
  );
}
