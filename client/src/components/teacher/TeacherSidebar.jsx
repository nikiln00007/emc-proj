import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/teacher/dashboard',   label: 'Dashboard',       icon: '📊' },
  { to: '/teacher/pending',     label: 'Pending Reviews', icon: '⏳' },
  { to: '/teacher/evaluations', label: 'All Submissions', icon: '📋' },
  { to: '/teacher/gradebook',   label: 'Gradebook',       icon: '📗' },
  { to: '/teacher/analytics',   label: 'Analytics',       icon: '📈' },
];

export default function TeacherSidebar({ mobileOpen, onClose }) {
  const { role } = useAuth();
  const isAdmin   = role === 'admin';

  const itemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
    ${isActive
      ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 text-orange-600 border border-orange-200/60'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 z-50
        bg-white border-r border-gray-100 flex flex-col py-6 px-3
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="px-3 mb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200
            text-indigo-800 text-xs font-extrabold px-3 py-1.5 rounded-full">
            👨‍🏫 Teacher Portal
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} className={itemClass} onClick={onClose}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="mx-3 my-3 border-t border-gray-100" />
              <NavLink to="/teacher/manage" className={itemClass} onClick={onClose}>
                <span className="text-base">👑</span>
                Manage Teachers
              </NavLink>
            </>
          )}
        </nav>

        {/* Back to student view */}
        <div className="px-3 pt-4 border-t border-gray-100">
          <Link
            to="/home"
            className="flex items-center gap-2 text-xs font-semibold text-gray-400
              hover:text-orange-500 transition-colors"
          >
            ← Back to Student View
          </Link>
        </div>
      </aside>
    </>
  );
}
