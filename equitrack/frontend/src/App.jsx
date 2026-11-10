import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AppLayout, AccountLayout, StaffLayout } from './components/layout/Layouts.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { homePathFor } from './lib/constants.js';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import FAQs from './pages/FAQs.jsx';
import { NotFound, Unauthorized } from './pages/NotFound.jsx';
import Directory from './pages/Directory.jsx';
import ReportDetail from './pages/ReportDetail.jsx';

import UserDashboard from './pages/user/UserDashboard.jsx';
import SubmitReport from './pages/user/SubmitReport.jsx';
import MyReports from './pages/user/MyReports.jsx';
import AccountProfile from './pages/account/AccountProfile.jsx';
import AccountSecurity from './pages/account/AccountSecurity.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageReports from './pages/admin/ManageReports.jsx';

import Statistics from './pages/superadmin/Statistics.jsx';
import Users from './pages/superadmin/Users.jsx';
import ReferenceData from './pages/superadmin/ReferenceData.jsx';
import DirectoryManage from './pages/superadmin/DirectoryManage.jsx';
import AuditLogs from './pages/superadmin/AuditLogs.jsx';

/**
 * ROUTE MAP
 *   public ............ /  /login  /register  /faqs  /directory  /reports/:id  /unauthorized
 *   any signed-in user  /dashboard  /reports  /reports/new  /account/*
 *   admin + super admin /admin  /admin/reports  /admin/reports/:id
 *   super admin only .. /super-admin  /super-admin/users|reference|directory|audit
 *   anything else ..... 404
 */
export default function App() {
  return (
    <Routes>
      {/* pages with the top navbar */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/reports" element={<MyReports />} />
          <Route path="/reports/new" element={<SubmitReport />} />
        </Route>
        <Route path="/reports/:id" element={<ReportDetail />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* auth screens (no navbar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* account screens (sidebar) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AccountLayout />}>
          <Route path="/account" element={<AccountProfile />} />
          <Route path="/account/security" element={<AccountSecurity />} />
        </Route>
      </Route>

      {/* admin panel */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<StaffLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reports/new" element={<SubmitReport />} />
          <Route path="/admin/reports" element={<ManageReports />} />
          <Route path="/admin/reports/:id" element={<ReportDetail />} />
        </Route>
      </Route>

      {/* super admin panel */}
      <Route element={<ProtectedRoute role="super_admin" />}>
        <Route element={<StaffLayout />}>
          <Route path="/super-admin" element={<Statistics />} />
          <Route path="/super-admin/users" element={<Users />} />
          <Route path="/super-admin/reference" element={<ReferenceData />} />
          <Route path="/super-admin/directory" element={<DirectoryManage />} />
          <Route path="/super-admin/audit" element={<AuditLogs />} />
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function DashboardHome() {
  const { user } = useAuth();
  return user?.role === 'user'
    ? <UserDashboard />
    : <Navigate to={homePathFor(user)} replace />;
}
