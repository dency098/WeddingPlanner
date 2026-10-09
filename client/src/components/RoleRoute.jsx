import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function RoleRoute({ allowedRoles, children }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading your session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
}
