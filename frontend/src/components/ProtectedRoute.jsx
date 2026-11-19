import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { hasRole } from '../lib/constants.js';
import { PageLoader, ErrorState } from './ui/Feedback.jsx';

/**
 * Route guard (used in App.jsx):
 *   <Route element={<ProtectedRoute />}>                 -> any logged-in user
 *   <Route element={<ProtectedRoute role="admin" />}>    -> admin or super admin
 *  - not logged in  -> /login (remembers where you wanted to go)
 *  - wrong role     -> /unauthorized
 * (The server ALSO checks roles on every request - this guard is only for good UX.)
 */
export default function ProtectedRoute({ role }) {
  const { user, ready, bootError, retryBoot } = useAuth();
  const location = useLocation();

  if (!ready) return <PageLoader label="Checking your session…" />;
  if (bootError && !user) return <ErrorState message={bootError} onRetry={retryBoot} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role && !hasRole(user, role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
