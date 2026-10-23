import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Logo from './Logo.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [open, setOpen] = useState(false);
  const menu = useRef(null);

  useEffect(() => { if (loc.pathname === '/reports') setQ(params.get('q') || ''); }, [loc.pathname, params]);
  useEffect(() => {
    const close = (e) => { if (menu.current && !menu.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(loc.pathname === '/reports' ? params : {});
    q.trim() ? next.set('q', q.trim()) : next.delete('q');
    nav('/reports?' + next.toString());
  };

  return (
    <header className="topbar">
      <Link to="/reports" className="topbar-brand">
        <Logo width={92} />
        <div className="tagline">
          <span>REPORTING A REPAIR?</span>
          YOU’RE IN THE RIGHT PLACE!
        </div>
      </Link>

      <form className="search" onSubmit={submit} role="search">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9a9aa0" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by status or location..." aria-label="Search reports" />
      </form>

      <Link to="/reports/new" className="btn btn-dark-green">FILE A REPORT</Link>
      <Link to="/faqs" className="nav-faq">FAQs</Link>

      <div className="profile" ref={menu}>
        <button className="avatar" onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open}>
          <svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="32" r="32" fill="#fff" />
            <circle cx="32" cy="24" r="10" fill="#000" /><path d="M12 52c2-11 10-16 20-16s18 5 20 16c-5 6-12 9-20 9s-15-3-20-9z" fill="#000" /></svg>
        </button>
        {open && (
          <div className="dropdown">
            <div className="dropdown-name">{user.first_name} {user.last_name}<small>{user.email}</small></div>
            <Link to="/reports?mine=1" onClick={() => setOpen(false)}>My reports</Link>
            <button onClick={async () => { await logout(); nav('/login'); }}>Log out</button>
          </div>
        )}
      </div>
    </header>
  );
}
