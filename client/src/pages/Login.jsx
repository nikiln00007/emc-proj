import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FIREBASE_ERRORS = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'teacher'
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password, selectedRole);
      navigate(selectedRole === 'teacher' ? '/admin' : '/home');
    } catch (err) {
      const code = err.code || '';
      setError(FIREBASE_ERRORS[code] || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTeacherLogin = async () => {
    setLoading(true);
    try {
      await login('prof.anderson@university.edu', 'evaluator123', 'teacher');
      navigate('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-extrabold text-gray-900 text-xl">Peer<span className="text-orange-500">Hub</span></span>
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-6 mb-2">Welcome back</h1>
          <p className="text-gray-500 text-sm">Sign in to your account</p>
        </div>

        <div className="card p-8 shadow-xl border-gray-100">
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'student'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              👨‍🏫 Teacher / Judge
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label" htmlFor="email">
                {selectedRole === 'teacher' ? 'Faculty / Evaluator Email' : 'Student Email'}
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder={selectedRole === 'teacher' ? 'prof.anderson@university.edu' : 'student@example.com'}
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={`w-full justify-center py-3 text-sm font-bold rounded-xl transition-all shadow-md text-white ${
                selectedRole === 'teacher'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'btn-primary'
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : selectedRole === 'teacher' ? '👨‍🏫 Sign In as Evaluator' : 'Sign In as Student'}
            </button>
          </form>

          {/* Quick Demo Login as Teacher button */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleQuickTeacherLogin}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>⚡ One-Click Demo: Sign in as Judge / Teacher</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
