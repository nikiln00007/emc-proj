import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Public / student pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import ProjectDetails from './pages/ProjectDetails';
import AddProject from './pages/AddProject';
import EditProject from './pages/EditProject';
import MyProjects from './pages/MyProjects';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Teacher portal pages (lazy-loaded after auth guard)
import TeacherDashboard  from './pages/teacher/Dashboard';
import PendingReviews    from './pages/teacher/PendingReviews';
import EvaluationDetail  from './pages/teacher/EvaluationDetail';
import Gradebook         from './pages/teacher/Gradebook';
import TeacherAnalytics  from './pages/teacher/Analytics';
import ManageTeachers    from './pages/teacher/ManageTeachers';

const TEACHER_ROLES = ['teacher', 'admin'];
const ADMIN_ROLES   = ['admin'];

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public routes ─────────────────────────────────── */}
            <Route path="/"            element={<Landing />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/signup"      element={<Signup />} />
            <Route path="/home"        element={<Home />} />
            <Route path="/projects"    element={<Home />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/profile/:uid" element={<Profile />} />
            <Route path="/analytics"   element={<Analytics />} />

            {/* Legacy admin route → protected for teachers/admins only */}
            <Route path="/admin"       element={<ProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/evaluations" element={<ProtectedRoute allowedRoles={TEACHER_ROLES}><PendingReviews /></ProtectedRoute>} />

            {/* ── Student-protected routes ─────────────────────── */}
            <Route path="/add-project"       element={<ProtectedRoute><AddProject /></ProtectedRoute>} />
            <Route path="/edit-project/:id"  element={<ProtectedRoute><EditProject /></ProtectedRoute>} />
            <Route path="/my-projects"       element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
            <Route path="/bookmarks"         element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />

            {/* ── Teacher-protected routes ─────────────────────── */}
            <Route
              path="/teacher/dashboard"
              element={<ProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherDashboard /></ProtectedRoute>}
            />
            <Route
              path="/teacher/pending"
              element={<ProtectedRoute allowedRoles={TEACHER_ROLES}><PendingReviews /></ProtectedRoute>}
            />
            <Route
              path="/teacher/evaluations"
              element={<ProtectedRoute allowedRoles={TEACHER_ROLES}><PendingReviews /></ProtectedRoute>}
            />
            <Route
              path="/teacher/evaluations/:id"
              element={<ProtectedRoute allowedRoles={TEACHER_ROLES}><EvaluationDetail /></ProtectedRoute>}
            />
            <Route
              path="/teacher/gradebook"
              element={<ProtectedRoute allowedRoles={TEACHER_ROLES}><Gradebook /></ProtectedRoute>}
            />
            <Route
              path="/teacher/analytics"
              element={<ProtectedRoute allowedRoles={TEACHER_ROLES}><TeacherAnalytics /></ProtectedRoute>}
            />
            <Route
              path="/teacher/manage"
              element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><ManageTeachers /></ProtectedRoute>}
            />

            {/* ── Redirect /teacher → /teacher/dashboard ─────── */}
            <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />

            {/* ── 404 ───────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
