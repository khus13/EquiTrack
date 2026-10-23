import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Header from './components/Header.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Reports from './pages/Reports.jsx';
import FileReport from './pages/FileReport.jsx';
import ReportDetail from './pages/ReportDetail.jsx';
import Faqs from './pages/Faqs.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="center-msg">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-msg">Loading…</div>;
  return user ? <Navigate to="/reports" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/reports/new" element={<Protected><FileReport /></Protected>} />
      <Route path="/reports/:id" element={<Protected><ReportDetail /></Protected>} />
      <Route path="/faqs" element={<Protected><Faqs /></Protected>} />
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  );
}
