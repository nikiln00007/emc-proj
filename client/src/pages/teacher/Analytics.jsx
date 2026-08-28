import { useState, useEffect } from 'react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import api from '../../utils/api';
import { numericToLetter, gradeColors } from '../../utils/gradeHelpers';

function BarChart({ data, maxVal }) {
  if (!data?.length) return <p className="text-xs text-gray-400 py-4 text-center">No data yet.</p>;

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const pct = maxVal > 0 ? Math.round(((item.averageGrade || 0) / maxVal) * 100) : 0;
        const letter = numericToLetter(item.averageGrade);
        const colorClass = gradeColors[letter] || gradeColors['—'];
        return (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span className="w-24 font-semibold text-gray-700 truncate flex-shrink-0 text-right">{item.tag}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-12 text-right text-gray-500 flex-shrink-0">
              {item.averageGrade ? `${item.averageGrade}/10` : '—'}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border flex-shrink-0 ${colorClass}`}>
              {letter}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TimelineChart({ data }) {
  if (!data?.length) return <p className="text-xs text-gray-400 py-4 text-center">No data yet.</p>;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, i) => {
        const pct = Math.round((item.count / maxCount) * 100);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] text-gray-500 font-semibold">{item.count || ''}</span>
            <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden flex items-end" style={{ height: '80px' }}>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-pink-400 transition-all duration-700"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[8px] text-gray-400 truncate max-w-full">{item.date}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function TeacherAnalytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get('/api/teacher/analytics');
        setData(d);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <TeacherLayout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-200
          text-purple-800 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
          📈 Analytics
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Evaluation Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Insights across submissions, grades, and student performance.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Summary stats */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Evaluations', value: data.summary.totalEvaluations, icon: '📋' },
            { label: 'Total Projects',    value: data.summary.totalProjects,    icon: '📁' },
            { label: 'Total Students',   value: data.summary.totalStudents,    icon: '🎓' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Submissions over time */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">
            📅 Submissions (Last 7 Days)
          </h2>
          {loading ? (
            <div className="flex items-end gap-2 h-32 animate-pulse">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 rounded-t-lg skeleton" style={{ height: `${30 + i * 10}%` }} />
              ))}
            </div>
          ) : (
            <TimelineChart data={data?.timeline} />
          )}
        </div>

        {/* Average grade by tech tag */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">
            🏷️ Avg Grade by Technology
          </h2>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="flex-1 skeleton h-4 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <BarChart
              data={data?.tagAnalytics?.slice(0, 10)}
              maxVal={10}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students with zero submissions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">
            😶 Zero Submissions
            <span className="ml-2 text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              {data?.zeroSubmissionStudents?.length ?? '—'}
            </span>
          </h2>
          {data?.zeroSubmissionStudents?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-semibold text-emerald-700">All students have submitted!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.zeroSubmissionStudents?.map(s => (
                <div key={s.firebaseUid}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50">
                  {s.profileImage ? (
                    <img src={s.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400
                      flex items-center justify-center text-white text-xs font-bold">
                      {(s.name || 'S')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teacher workload */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">
            ⚖️ Teacher Workload
          </h2>
          {!data?.teacherWorkload?.length ? (
            <p className="text-xs text-gray-400 py-4 text-center">No grading activity yet.</p>
          ) : (
            <div className="space-y-3">
              {data.teacherWorkload.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{t.name}</p>
                    <p className="text-[10px] text-gray-400">{t.inReviewCount} in progress</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-700">{t.completedReviews}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Graded</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
