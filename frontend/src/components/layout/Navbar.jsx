import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { hasRole, homePathFor, ROLE_LABEL } from '../../lib/constants.js';
import { IconSearch, IconUser, IconMenu, IconClose, IconLogout, IconCog, IconClipboard, IconGrid } from '../ui/Icons.jsx';

/** Top bar (black) - matches the Canva design: logo, tagline, search, File a Report, FAQs, avatar menu. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);       // avatar dropdown
  const [mobile, setMobile] = useState(false);   // hamburger panel
  const [q, setQ] = useState('');
  const box = useRef(null);

  // close the dropdown when clicking outside / pressing Escape
  useEffect(() => {
    const onClick = (e) => { if (box.current && !box.current.contains(e.target)) setMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setMenu(false); setMobile(false); } };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(`/directory${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
    setMobile(false);
  };
  const doLogout = async () => { setMenu(false); setMobile(false); await logout(); navigate('/'); };
  const link = ({ isActive }) => `rounded-pill px-3 py-1.5 font-display font-semibold hover:text-accent ${isActive ? 'text-accent' : 'text-white'}`;

  return (
    <header className="sticky top-0 z-40 bg-surface-nav">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Logo className="h-11" to={user ? homePathFor(user) : '/'} />
        <p className="hidden text-small font-semibold uppercase leading-tight xl:block">
          <span className="text-primary">Reporting a repair?</span><br />You’re in the right place!
        </p>

        {user && (
          <form onSubmit={search} role="search" className="relative ml-auto hidden max-w-md flex-1 md:block">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment by name, tag or location…"
                   aria-label="Search equipment" className="w-full rounded-pill border-2 border-transparent bg-surface-base py-2.5 pl-12 pr-4 text-white placeholder:text-muted focus:border-accent" />
          </form>
        )}

        <nav aria-label="Main" className={`${user ? '' : 'ml-auto'} hidden items-center gap-2 md:flex`}>
          {user ? (
            <>
              <Link to="/reports/new" className="btn btn-primary btn-sm uppercase">File a report</Link>
              <NavLink to="/directory" className={link}>Directory</NavLink>
              <NavLink to="/faqs" className={link}>FAQs</NavLink>
              <div className="relative" ref={box}>
                <button type="button" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black hover:ring-2 hover:ring-accent">
                  <IconUser className="h-6 w-6" />
                </button>
                {menu && (
                  <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-surface-line bg-surface-raised shadow-card">
                    <div className="border-b border-surface-line px-4 py-3">
                      <p className="truncate font-semibold">{user.full_name}</p>
                      <p className="truncate text-tiny text-muted">{user.email} · {ROLE_LABEL[user.role]}</p>
                    </div>
                    <MenuLink to="/dashboard" icon={IconGrid} onClick={() => setMenu(false)}>My dashboard</MenuLink>
                    <MenuLink to="/reports" icon={IconClipboard} onClick={() => setMenu(false)}>My reports</MenuLink>
                    <MenuLink to="/account" icon={IconCog} onClick={() => setMenu(false)}>Account</MenuLink>
                    {hasRole(user, 'admin') && <MenuLink to={homePathFor(user)} icon={IconCog} onClick={() => setMenu(false)}>{hasRole(user, 'super_admin') ? 'Super Admin panel' : 'Admin panel'}</MenuLink>}
                    <button type="button" role="menuitem" onClick={doLogout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-danger-light hover:bg-white/5"><IconLogout />Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/faqs" className={link}>FAQs</NavLink>
              <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </nav>

        <button type="button" className="ml-auto rounded-lg p-2 hover:bg-white/10 md:hidden" onClick={() => setMobile((m) => !m)} aria-expanded={mobile} aria-controls="mobile-nav" aria-label={mobile ? 'Close menu' : 'Open menu'}>
          {mobile ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>
      </div>

      {mobile && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-surface-line px-4 pb-4 pt-3 md:hidden">
          {user && (
            <form onSubmit={search} role="search" className="mb-3">
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment…" aria-label="Search equipment"
                     className="w-full rounded-pill bg-surface-base px-5 py-2.5 text-white placeholder:text-muted" />
            </form>
          )}
          <ul className="space-y-1 font-display text-h3">
            {user ? (
              <>
                <li><Link to="/reports/new" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2 text-primary">File a report</Link></li>
                <li><Link to="/dashboard" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Dashboard</Link></li>
                <li><Link to="/reports" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">My reports</Link></li>
                <li><Link to="/directory" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Directory</Link></li>
                <li><Link to="/account" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Account</Link></li>
                {hasRole(user, 'admin') && <li><Link to={homePathFor(user)} onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">{hasRole(user, 'super_admin') ? 'Super Admin panel' : 'Admin panel'}</Link></li>}
                <li><Link to="/faqs" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">FAQs</Link></li>
                <li><button type="button" onClick={doLogout} className="block w-full rounded-xl px-3 py-2 text-left text-danger-light">Log out</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Log in</Link></li>
                <li><Link to="/register" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2 text-primary">Sign up</Link></li>
                <li><Link to="/faqs" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">FAQs</Link></li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}

function MenuLink({ to, icon: Icon, children, onClick }) {
  return <Link to={to} role="menuitem" onClick={onClick} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5"><Icon className="h-5 w-5 text-muted" />{children}</Link>;
}
