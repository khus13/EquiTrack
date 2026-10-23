import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Logo from './Logo.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Keep the search box in sync with the URL when browsing results.
  useEffect(() => {
    if (location.pathname === '/') {
      setQ(new URLSearchParams(location.search).get('q') || '');
    } else {
      setQ('');
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/');
  };

  return (
    <header className="navbar">
      <Link to="/" className="nav-brand" aria-label="EquiTrack home">
        <Logo size={0.3} />
        <div className="nav-tagline">
          <span className="green">REPORTING A REPAIR?</span>
          <span>YOU'RE IN THE RIGHT PLACE!</span>
        </div>
      </Link>

      <form className="nav-search" onSubmit={submit} role="search">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="7" />
          <line x1="16" y1="16" x2="22" y2="22" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by status or location..."
          aria-label="Search reports"
        />
      </form>

      <nav className="nav-actions">
        <Link to="/report/new" className="btn btn-green btn-sm">FILE A REPORT</Link>
        <Link to="/faqs" className="nav-link">FAQs</Link>
        <div className="avatar-wrap" ref={menuRef}>
          <button className="avatar" onClick={() => setMenuOpen((o) => !o)} aria-label="Account menu" aria-expanded={menuOpen}>
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              <circle cx="12" cy="8.5" r="4.2" fill="#000" />
              <path d="M3.5 22c0-5 3.8-8 8.5-8s8.5 3 8.5 8z" fill="#000" />
            </svg>
          </button>
          {menuOpen && (
            <div className="menu">
              <div className="menu-user">
                <strong>{user.first_name} {user.last_name}</strong>
                <span>{user.email}</span>
                {user.role === 'admin' && <em>Administrator</em>}
              </div>
              <button onClick={logout}>Log out</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
