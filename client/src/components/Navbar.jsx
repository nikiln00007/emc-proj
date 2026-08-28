import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, dbUser, role, isTeacher, switchRole, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [teacherDropdown, setTeacherDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close teacher dropdown on outside click
  useEffect(() => {
    const close = () => setTeacherDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors duration-200 ${
      isActive ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'
    }`;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-extrabold text-gray-900 text-lg tracking-tight">
            Peer<span className="text-orange-500">Hub</span>
          </span>
          {isTeacher && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200 ml-1">
              👨‍🏫 {isAdmin ? 'Admin' : 'Teacher'}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          <NavLink to="/home" className={navLinkClass}>Explore</NavLink>
          <NavLink to="/analytics" className={navLinkClass}>Stats</NavLink>

          {currentUser ? (
            <>
              {/* ── STUDENT NAV ── */}
              {!isTeacher && (
                <>
                  <NavLink to="/my-projects" className={navLinkClass}>My Projects</NavLink>
                  <NavLink to="/bookmarks" className={navLinkClass}>Bookmarks</NavLink>
                </>
              )}

              {/* Profile */}
              <NavLink to={`/profile/${currentUser.uid}`} className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  {currentUser.photoURL || dbUser?.profileImage ? (
                    <img src={currentUser.photoURL || dbUser.profileImage} alt="profile" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                      {(dbUser?.name || currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span>Profile</span>
                </span>
              </NavLink>

              {/* ── TEACHER BADGE + DROPDOWN ── */}
              {isTeacher ? (
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setTeacherDropdown(p => !p)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl
                      bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all"
                  >
                    <span>{isAdmin ? '👑 Admin' : '👨‍🏫 Teacher'}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>

                  {teacherDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      {[
                        { to: '/teacher/dashboard',   label: '📊 Dashboard'       },
                        { to: '/teacher/pending',     label: '⏳ Pending Reviews'  },
                        { to: '/teacher/evaluations', label: '📋 All Submissions'  },
                        { to: '/teacher/gradebook',   label: '📗 Gradebook'        },
                        { to: '/teacher/analytics',   label: '📈 Analytics'        },
                        ...(isAdmin ? [{ to: '/teacher/manage', label: '👑 Manage Teachers' }] : []),
                      ].map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setTeacherDropdown(false)}
                          className="block px-4 py-2 text-sm font-semibold text-gray-700
                            hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Student badge */
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl
                  bg-orange-50 border border-orange-200 text-orange-700">
                  🎓 Student
                </span>
              )}

              {/* Role switcher — for development demo */}
              <button
                onClick={() => switchRole(isTeacher ? 'student' : 'teacher')}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-200
                  text-gray-400 hover:bg-gray-100 transition-all"
                title="Toggle role (dev mode)"
              >
                ⇄
              </button>

              {/* Share Project or Grade button */}
              {!isTeacher ? (
                <Link to="/add-project" className="btn-primary text-sm py-2 px-4 shadow-sm">
                  + Share Project
                </Link>
              ) : (
                <Link to="/teacher/pending"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-sm">
                  Grade Submissions →
                </Link>
              )}

              <button onClick={handleLogout} className="btn-ghost text-xs py-2 px-2 text-red-500 hover:text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => switchRole(isTeacher ? 'student' : 'teacher')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              >
                {isTeacher ? '👨‍🏫 Judge Mode' : '🎓 Student Mode'}
              </button>
              <NavLink to="/login" className={navLinkClass}>Login</NavLink>
              <Link to="/signup" className="btn-primary text-sm py-2">
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="flex flex-col px-4 py-4 gap-1">
            <NavLink to="/home" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
              Explore Projects
            </NavLink>
            <NavLink to="/analytics" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
              Platform Stats
            </NavLink>

            {currentUser ? (
              <>
                {/* Student mobile nav */}
                {!isTeacher && (
                  <>
                    <NavLink to="/my-projects" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-500" onClick={() => setMenuOpen(false)}>My Projects</NavLink>
                    <NavLink to="/bookmarks" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-500" onClick={() => setMenuOpen(false)}>Bookmarks</NavLink>
                    <Link to="/add-project" className="btn-primary justify-center mt-2" onClick={() => setMenuOpen(false)}>+ Share Project</Link>
                  </>
                )}

                {/* Teacher mobile nav */}
                {isTeacher && (
                  <>
                    <div className="px-3 py-2 text-[10px] font-extrabold uppercase text-indigo-500 tracking-wider mt-2">
                      👨‍🏫 Teacher Portal
                    </div>
                    {[
                      { to: '/teacher/dashboard',   label: '📊 Dashboard'       },
                      { to: '/teacher/pending',     label: '⏳ Pending Reviews'  },
                      { to: '/teacher/evaluations', label: '📋 All Submissions'  },
                      { to: '/teacher/gradebook',   label: '📗 Gradebook'        },
                      { to: '/teacher/analytics',   label: '📈 Analytics'        },
                      ...(isAdmin ? [{ to: '/teacher/manage', label: '👑 Manage Teachers' }] : []),
                    ].map(item => (
                      <NavLink key={item.to} to={item.to}
                        className="px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                        onClick={() => setMenuOpen(false)}>
                        {item.label}
                      </NavLink>
                    ))}
                  </>
                )}

                <NavLink to={`/profile/${currentUser.uid}`} className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                  My Profile
                </NavLink>

                <button
                  onClick={() => { switchRole(isTeacher ? 'student' : 'teacher'); setMenuOpen(false); }}
                  className="px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 text-left mt-2"
                >
                  Switch Role: {isTeacher ? '👨‍🏫 Teacher Mode' : '🎓 Student Mode'} (Click to change)
                </button>

                <button onClick={handleLogout} className="btn-ghost justify-center text-red-500 hover:bg-red-50 mt-1">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-500" onClick={() => setMenuOpen(false)}>Login</NavLink>
                <Link to="/signup" className="btn-primary justify-center mt-2" onClick={() => setMenuOpen(false)}>Sign Up Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
