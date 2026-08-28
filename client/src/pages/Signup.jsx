import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'teacher'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Please enter your name.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      await signup(form.email, form.password, form.name.trim(), selectedRole);
      navigate(selectedRole === 'teacher' ? '/admin' : '/home');
    } catch (err) {
      const code = err.code || '';
      setError(FIREBASE_ERRORS[code] || err.message || 'Signup failed. Please try again.');
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
          <h1 className="text-3xl font-extrabold text-gray-900 mt-6 mb-2">Join PeerHub</h1>
          <p className="text-gray-500 text-sm">Create your account</p>
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
              🎓 Student Account
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
              <label className="form-label" htmlFor="name">
                {selectedRole === 'teacher' ? 'Faculty / Evaluator Full Name' : 'Full Name'}
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder={selectedRole === 'teacher' ? 'Prof. David Miller' : 'Alex Johnson'}
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder={selectedRole === 'teacher' ? 'd.miller@university.edu' : 'you@example.com'}
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
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                required
                autoComplete="new-password"
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
                  Creating account...
                </span>
              ) : selectedRole === 'teacher' ? '👨‍🏫 Register as Faculty Judge' : 'Create Student Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
