import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hasToken = !!localStorage.getItem('cc-facility-token');

  if (loading) return null;

  // Only redirect if no token at all — transient fetchMe failures don't log out
  if (!user && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
