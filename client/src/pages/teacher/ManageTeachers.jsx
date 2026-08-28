import { useState, useEffect } from 'react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import api from '../../utils/api';

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [inviteEmail, setInvite]= useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setResult] = useState('');
  const [toast, setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/teacher/admin/teachers');
      setTeachers(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { data } = await api.post('/api/teacher/invite', {
        email: inviteEmail,
        department: 'Computer Science',
        subjects: ['Web Development'],
      });
      setResult(data.message);
      showToast('✅ Teacher invited successfully!');
      setInvite('');
      load();
    } catch (e) {
      showToast('❌ ' + e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/api/teacher/users/${userId}/role`, { role: newRole });
      showToast(`✅ Role updated to ${newRole}`);
      load();
    } catch (e) {
      showToast('❌ ' + e.message);
    }
  };

  return (
    <TeacherLayout>
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm font-semibold
          px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200
          text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
          👑 Admin Only
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Manage Teachers</h1>
        <p className="text-gray-500 text-sm mt-1">
          Grant or revoke teacher and admin privileges.
        </p>
      </div>

      {/* Invite Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">
          ✉️ Invite / Promote to Teacher
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={e => setInvite(e.target.value)}
            placeholder="faculty@university.edu"
            className="form-input flex-1 text-sm min-w-[200px]"
          />
          <button
            type="submit"
            disabled={inviting}
            className="btn-primary py-2.5 px-6 text-sm"
          >
            {inviting ? 'Processing...' : '+ Grant Teacher Access'}
          </button>
        </form>
        {inviteResult && (
          <div className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200
            rounded-xl px-4 py-2">
            ✅ {inviteResult}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Teachers list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
            Faculty Members ({teachers.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {loading && [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-48" />
              </div>
            </div>
          ))}

          {!loading && teachers.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-400 font-semibold">No teachers yet</p>
              <p className="text-xs text-gray-300 mt-1">Use the form above to invite faculty</p>
            </div>
          )}

          {!loading && teachers.map(t => (
            <div key={t._id || t.firebaseUid}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              {t.profileImage ? (
                <img src={t.profileImage} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400
                  flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(t.name || 'T')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">{t.email}</p>
                {t.teacherProfile?.department && (
                  <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                    {t.teacherProfile.department}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
                  ${t.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'}`}>
                  {t.role === 'admin' ? '👑 Admin' : '👨‍🏫 Teacher'}
                </span>
                <select
                  value={t.role}
                  onChange={e => handleRoleChange(t.firebaseUid || t._id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none
                    focus:border-orange-400 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TeacherLayout>
  );
}
