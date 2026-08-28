import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import StatusBadge from '../../components/teacher/StatusBadge';
import GradePill from '../../components/teacher/GradePill';
import api from '../../utils/api';
import { formatWaitTime } from '../../utils/gradeHelpers';
import { getLocalProjects, getProjectEvaluation } from '../../utils/projectStorage';

const TAGS = ['All', 'React', 'Node.js', 'Python', 'AI', 'JavaScript', 'TypeScript', 'MongoDB', 'Vue'];

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function PendingReviews() {
  const location = useLocation();
  const isPendingOnly = location.pathname.includes('/pending');

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState(isPendingOnly ? 'pending' : '');
  const [tagFilter, setTag]           = useState('All');

  // Reset status filter when navigating between Pending Reviews and All Submissions
  useEffect(() => {
    setStatus(isPendingOnly ? 'pending' : '');
  }, [isPendingOnly]);

  const load = useCallback(async () => {
    setLoading(true);

    // 1. Prepare local student submissions
    const localProjects = getLocalProjects();
    const localFormatted = localProjects.map((p, idx) => {
      const ev = getProjectEvaluation(p._id);
      const submittedAt = p.submittedForEvaluationAt || p.createdAt || new Date(Date.now() - idx * 86400000).toISOString();
      const waitMs = Date.now() - new Date(submittedAt).getTime();
      
      const isGraded = (ev && (ev.grade !== undefined || ev.status === 'graded')) || p.evaluationStatus === 'graded';
      const status = isGraded ? 'graded' : (ev?.status || p.evaluationStatus || 'pending');
      const numGrade = ev?.grade !== undefined && !isNaN(Number(ev.grade)) ? Number(ev.grade) : (isGraded ? 8.5 : null);

      return {
        _id: ev?._id || p._id,
        project: p,
        student: p.owner || { name: 'Student Developer', email: 'student@peerhub.edu' },
        status,
        grade: numGrade,
        letterGrade: ev?.letterGrade || (numGrade !== null ? 'B+' : ''),
        submittedAt,
        waitDays: Math.floor(waitMs / (1000 * 60 * 60 * 24)),
        waitHours: Math.floor(waitMs / (1000 * 60 * 60)),
      };
    });

    const filterList = (list) => {
      let res = list;
      if (isPendingOnly) {
        res = res.filter(e => e.status !== 'graded');
      } else if (statusFilter) {
        res = res.filter(e => e.status === statusFilter);
      }
      if (tagFilter !== 'All') {
        res = res.filter(e => e.project?.tags?.includes(tagFilter));
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        res = res.filter(e =>
          e.project?.title?.toLowerCase().includes(q) ||
          e.student?.name?.toLowerCase().includes(q)
        );
      }
      return res;
    };

    try {
      const endpoint = isPendingOnly ? '/api/teacher/pending' : '/api/teacher/evaluations';
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (tagFilter !== 'All') params.set('tag', tagFilter);
      if (search.trim()) params.set('search', search.trim());
      
      const { data } = await api.get(`${endpoint}?${params.toString()}`);
      if (data && Array.isArray(data.evaluations) && data.evaluations.length > 0) {
        setEvaluations(filterList(data.evaluations));
      } else {
        setEvaluations(filterList(localFormatted));
      }
    } catch (e) {
      setEvaluations(filterList(localFormatted));
    } finally {
      setLoading(false);
    }
  }, [isPendingOnly, search, statusFilter, tagFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <TeacherLayout>
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 border text-xs font-extrabold px-3 py-1 rounded-full mb-3 ${
          isPendingOnly
            ? 'bg-amber-100 border-amber-200 text-amber-800'
            : 'bg-indigo-100 border-indigo-200 text-indigo-800'
        }`}>
          {isPendingOnly ? '⏳ Pending Reviews Queue' : '📋 All Student Submissions'}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {isPendingOnly ? 'Project Evaluation Queue' : 'All Project Submissions'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isPendingOnly
                ? `${evaluations.length} submission${evaluations.length !== 1 ? 's' : ''} awaiting your faculty review`
                : `${evaluations.length} total student submission${evaluations.length !== 1 ? 's' : ''} recorded`}
            </p>
          </div>
          <button
            onClick={() => load()}
            className="self-start sm:self-auto text-xs font-bold px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-3">
        <input
          type="search"
          placeholder="Search by student or project title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input text-sm flex-1"
        />
        {!isPendingOnly && (
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="form-input text-sm md:w-48"
          >
            <option value="">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="in_review">🔍 In Review</option>
            <option value="needs_revision">🔄 Needs Revision</option>
            <option value="graded">✅ Graded</option>
          </select>
        )}
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Student', 'Project', 'Tags', 'Submitted', 'Waiting', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(4)].map((_, i) => <SkeletonRow key={i} />)}

              {!loading && evaluations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="font-bold text-gray-700">
                      {isPendingOnly ? 'All caught up! No pending submissions.' : 'No submissions match your filters.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing search or checking other tabs</p>
                  </td>
                </tr>
              )}

              {!loading && evaluations.map(ev => {
                const student     = ev.student || {};
                const project     = ev.project || {};
                const submittedAt = ev.submittedAt || ev.createdAt;
                const dateStr     = submittedAt ? new Date(submittedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                }) : 'Recently';

                const isGraded = ev.status === 'graded';

                return (
                  <tr key={ev._id || project._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {student.profileImage || project.owner?.profileImage ? (
                          <img
                            src={student.profileImage || project.owner?.profileImage}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-orange-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400
                            flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                            {(student.name || project.owner?.name || 'S')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-800 text-xs">{student.name || project.owner?.name || 'Student'}</p>
                          <p className="text-[10px] text-gray-400">{student.email || project.owner?.email || ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="font-bold text-gray-900 text-xs line-clamp-1">{project.title || 'Untitled Project'}</p>
                      {project.description && (
                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{project.description}</p>
                      )}
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {project.tags?.slice(0, 2).map(t => (
                          <span key={t} className="bg-gray-100 text-gray-600 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{dateStr}</td>

                    {/* Waiting */}
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold ${ev.waitDays >= 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {formatWaitTime(submittedAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {isGraded && ev.grade !== undefined && ev.grade !== null && !isNaN(Number(ev.grade)) ? (
                        <GradePill grade={Number(ev.grade)} letterGrade={ev.letterGrade} size="sm" />
                      ) : (
                        <StatusBadge status={ev.status || 'pending'} size="sm" />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/teacher/evaluations/${project._id || ev._id}`}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl text-white shadow-sm whitespace-nowrap transition-all ${
                            isGraded
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90'
                          }`}
                        >
                          {isGraded ? 'Edit Marks →' : 'Grade →'}
                        </Link>
                        <Link
                          to={`/project/${project._id || ev._id}`}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-200
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
