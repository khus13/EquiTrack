import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { hasRole } from '../../lib/constants.js';
import { IconGrid, IconClipboard, IconUser, IconCog, IconUsers, IconDatabase, IconBox, IconShield, IconChart, IconHome } from '../ui/Icons.jsx';

/** Public + user pages: top navbar, content, footer. */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
      <Navbar />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

/** Account pages (screenshots): sidebar with Back / Account / My Reports. */
export function AccountLayout() {
  const sections = [
    { items: [
      { to: '/account', label: 'Profile info', icon: IconUser, end: true },
      { to: '/account/security', label: 'Password & security', icon: IconCog },
    ] },
    { items: [{ to: '/reports', label: 'My reports', icon: IconClipboard, end: true }] },
  ];
  return <PanelShell sidebar={<Sidebar sections={sections} backTo="/dashboard" showLogo={false} />} />;
}

/** Admin + Super Admin panel: sidebar content depends on the role. */
export function StaffLayout() {
  const { user } = useAuth();
  const sections = [
    { title: 'Admin', items: [
      { to: '/admin', label: 'Dashboard', icon: IconGrid, end: true },
      { to: '/admin/reports', label: 'Manage reports', icon: IconClipboard },
      { to: '/directory', label: 'Equipment directory', icon: IconBox },
    ] },
  ];
  if (hasRole(user, 'super_admin')) {
    sections.push({ title: 'Super Admin', items: [
      { to: '/super-admin', label: 'Statistics', icon: IconChart, end: true },
      { to: '/super-admin/users', label: 'Users', icon: IconUsers },
      { to: '/super-admin/reference', label: 'Reference data', icon: IconDatabase },
      { to: '/super-admin/directory', label: 'Manage directory', icon: IconBox },
      { to: '/super-admin/audit', label: 'Audit logs', icon: IconShield },
    ] });
  }
  sections.push({ items: [
    { to: '/account', label: 'My account', icon: IconCog },
    { to: '/dashboard', label: 'User view', icon: IconHome },
  ] });
  return <PanelShell sidebar={<Sidebar sections={sections} />} />;
}

function PanelShell({ sidebar }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
      {sidebar}
      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
    </div>
  );
}

/** Login + Register: split screen. */
export function AuthShell({ children, image = true }) {
  return (
    <div className={`grid min-h-screen ${image ? 'lg:grid-cols-2' : ''}`}>
      <div className="flex flex-col items-center justify-center bg-black px-5 py-10">{children}</div>
      {image && (
        <div className="relative hidden bg-surface-raised lg:block" aria-hidden="true">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=1400&q=70)' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-black/40" />
        </div>
      )}
    </div>
  );
}
