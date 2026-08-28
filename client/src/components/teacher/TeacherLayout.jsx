import { useState } from 'react';
import Navbar from '../Navbar';
import TeacherSidebar from './TeacherSidebar';

/**
 * TeacherLayout — wraps teacher pages with shared Navbar + Sidebar.
 */
export default function TeacherLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/60">
      <Navbar />

      <div className="flex flex-1">
        <TeacherSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 min-w-0 overflow-x-hidden">
          {/* Mobile sidebar toggle */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="text-sm font-bold text-indigo-700">👨‍🏫 Teacher Portal</span>
          </div>

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
