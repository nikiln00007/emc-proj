import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards routes by authentication and optional role check.
 * @param {string[]} allowedRoles - e.g. ['teacher', 'admin']. If omitted, only checks login.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Student tries to access teacher route → send home
    return <Navigate to="/home" replace />;
  }

  return children;
}
