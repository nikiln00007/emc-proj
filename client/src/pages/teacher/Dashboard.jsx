import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import NeedsAttentionCard from '../../components/teacher/NeedsAttentionCard';
import StatusBadge from '../../components/teacher/StatusBadge';
import GradePill from '../../components/teacher/GradePill';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function StatCard({ label, value, icon, color = 'orange', trend }) {
  const colors = {
    orange: 'from-orange-50 to-pink-50 border-orange-100 text-orange-600',
    blue:   'from-blue-50 to-indigo-50 border-blue-100 text-blue-600',
    amber:  'from-amber-50 to-yellow-50 border-amber-100 text-amber-600',
    emerald:'from-emerald-50 to-teal-50 border-emerald-100 text-emerald-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-[10px] font-bold bg-white/80 px-2 py-0.5 rounded-full border">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function GradeBar({ label, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-8 font-bold text-gray-700 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-gray-500 flex-shrink-0">{count}</span>
    </div>
  );
}

export default function TeacherDashboard() {
  const { currentUser, dbUser } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get('/api/teacher/dashboard');
        setData(d);
      } catch (e) {
        setError(e.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const teacherName = dbUser?.name || currentUser?.displayName || 'Faculty';

  return (
    <TeacherLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200
          text-indigo-700 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
          📊 Faculty Dashboard
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          Welcome back, {teacherName.replace('Prof. ', '')} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Academic Term 2026 — Here's your evaluation workload overview.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="skeleton h-8 w-8 rounded-xl mb-3" />
              <div className="skeleton h-7 w-16 mb-2" />
              <div className="skeleton h-3 w-28" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-6 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {data && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Pending Reviews"  value={data.stats?.pendingReviews}  icon="⏳" color="amber" />
            <StatCard label="Graded This Week" value={data.stats?.gradedThisWeek}  icon="✅" color="emerald" />
            <StatCard
              label="Average Grade"
              value={data.stats?.averageGrade ? `${data.stats.averageGrade}/10` : '—'}
              icon="⭐"
              color="orange"
            />
            <StatCard label="Active Students"  value={data.stats?.activeStudents}  icon="🎓" color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Needs Attention queue */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-gray-900">🔔 Needs Attention</h2>
                <Link to="/teacher/pending"
                  className="text-xs font-bold text-orange-500 hover:text-orange-600">
                  View all →
                </Link>
              </div>

              {data.needsAttention?.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-bold text-emerald-800">All caught up!</p>
                  <p className="text-xs text-emerald-600 mt-1">No pending submissions right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.needsAttention.slice(0, 6).map(ev => (
                    <NeedsAttentionCard key={ev._id} evaluation={ev} />
                  ))}
                </div>
              )}
            </div>

            {/* Grade distribution chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-5">
                📊 Grade Distribution
              </h2>
              {data.gradeDistribution ? (
                <div className="space-y-2.5">
                  {Object.entries(data.gradeDistribution).map(([letter, count]) => (
                    <GradeBar
                      key={letter}
                      label={letter}
                      count={count}
                      max={Math.max(...Object.values(data.gradeDistribution)) || 1}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">No grades yet.</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">
              🕒 Recent Activity
            </h2>
            {data.recentActivity?.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No recent activity.</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity?.slice(0, 6).map(ev => (
                  <div key={ev._id}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                        {ev.project?.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-gray-400">
                        by {ev.project?.owner?.name || '—'}
                        {ev.teacher?.name && ` · graded by ${ev.teacher.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <StatusBadge status={ev.status} size="sm" showIcon={false} />
                      {ev.status === 'graded' && (
                        <GradePill grade={ev.grade} letterGrade={ev.letterGrade} size="sm" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </TeacherLayout>
  );
}
