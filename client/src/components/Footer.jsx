import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-extrabold text-white text-xl tracking-tight">
                Peer<span className="text-orange-400">Hub</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              A community where developers showcase their coding projects,
              discover new ideas, and learn from each other.
            </p>
            <p className="text-sm font-semibold mt-4 gradient-text">Build. Share. Discover. Learn.</p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/home', label: 'All Projects' },
                { to: '/analytics', label: 'Platform Stats' },
                { to: '/signup', label: 'Join Community' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-orange-400 text-sm transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/login', label: 'Login' },
                { to: '/signup', label: 'Sign Up' },
                { to: '/my-projects', label: 'My Projects' },
                { to: '/bookmarks', label: 'Bookmarks' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-orange-400 text-sm transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2026 PeerHub. All rights reserved.</p>
          <p className="text-gray-600 text-xs">Made with ♥ for the developer community</p>
        </div>
      </div>
    </footer>
  );
}
