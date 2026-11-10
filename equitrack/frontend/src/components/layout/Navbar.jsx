import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { hasRole, homePathFor, ROLE_LABEL } from '../../lib/constants.js';
import { IconUser, IconMenu, IconClose, IconLogout, IconCog, IconClipboard, IconGrid } from '../ui/Icons.jsx';

/** Top bar (black) - matches the Canva design: logo, tagline, search, File a Report, FAQs, avatar menu. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);       // avatar dropdown
  const [mobile, setMobile] = useState(false);   // hamburger panel
  const box = useRef(null);

  // close the dropdown when clicking outside / pressing Escape
  useEffect(() => {
    const onClick = (e) => { if (box.current && !box.current.contains(e.target)) setMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setMenu(false); setMobile(false); } };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  const doLogout = async () => { setMenu(false); setMobile(false); await logout(); navigate('/'); };
  const link = ({ isActive }) => `rounded-pill px-3 py-1.5 font-display font-semibold hover:text-accent ${isActive ? 'text-accent' : 'text-white'}`;
  const reportFormPath = user && hasRole(user, 'admin') ? '/admin/reports/new' : '/reports/new';

  return (
    <header className="sticky top-0 z-40 border-b border-surface-line bg-surface-nav">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Logo className="h-11" to={user ? homePathFor(user) : '/'} />
        <p className="hidden text-small font-semibold leading-tight xl:block">
          <span className="text-primary">Reporting a repair?</span><br />You’re in the right place!
        </p>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-2 border-l border-surface-line pl-3 md:flex">
          {user ? (
            <>
              <NavLink to={homePathFor(user)} className={link}>Home</NavLink>
              <span aria-hidden="true" className="mx-1 h-6 border-l border-white/15" />
              <NavLink to={reportFormPath} className={link}>File a report</NavLink>
              <span aria-hidden="true" className="mx-1 h-6 border-l border-white/15" />
              {!hasRole(user, 'admin') && <NavLink to="/directory" className={link}>Directory</NavLink>}
              {!hasRole(user, 'admin') && <span aria-hidden="true" className="mx-1 h-6 border-l border-white/15" />}
              <NavLink to="/faqs" className={link}>FAQs</NavLink>
              <span aria-hidden="true" className="mx-1 h-6 border-l border-white/15" />
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
                    <MenuLink to={homePathFor(user)} icon={IconGrid} onClick={() => setMenu(false)}>Dashboard</MenuLink>
                    <MenuLink to={hasRole(user, 'admin') ? '/admin/reports' : '/reports'} icon={IconClipboard} onClick={() => setMenu(false)}>{hasRole(user, 'admin') ? 'All reports' : 'My reports'}</MenuLink>
                    <MenuLink to="/account" icon={IconUser} onClick={() => setMenu(false)}>Profile info</MenuLink>
                    <MenuLink to="/account/security" icon={IconCog} onClick={() => setMenu(false)}>Password &amp; security</MenuLink>
                    <button type="button" role="menuitem" onClick={doLogout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-danger-light hover:bg-white/5"><IconLogout />Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/" className={link}>Home</NavLink>
              <span aria-hidden="true" className="mx-1 h-6 border-l border-white/15" />
              <NavLink to="/directory" className={link}>Directory</NavLink>
              <span aria-hidden="true" className="mx-1 h-6 border-l border-white/15" />
              <NavLink to="/faqs" className={link}>FAQs</NavLink>
              <span aria-hidden="true" className="mx-1 h-6 border-l border-white/15" />
              <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
              <span aria-hidden="true" className="mx-1 h-6 border-l border-white/15" />
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
          <ul className="space-y-1 font-display text-h3">
            {user ? (
              <>
                <li><Link to={homePathFor(user)} onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Home</Link></li>
                <li><NavLink to={reportFormPath} onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2 text-primary">File a report</NavLink></li>
                <li><Link to={hasRole(user, 'admin') ? '/admin/reports' : '/reports'} onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">{hasRole(user, 'admin') ? 'All reports' : 'My reports'}</Link></li>
                {!hasRole(user, 'admin') && <li><Link to="/directory" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Directory</Link></li>}
                <li><Link to="/account" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Profile info</Link></li>
                <li><Link to="/account/security" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Password &amp; security</Link></li>
                <li><Link to="/faqs" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">FAQs</Link></li>
                <li><button type="button" onClick={doLogout} className="block w-full rounded-xl px-3 py-2 text-left text-danger-light">Log out</button></li>
              </>
            ) : (
              <>
                <li><Link to="/" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Home</Link></li>
                <li><Link to="/directory" onClick={() => setMobile(false)} className="block rounded-xl px-3 py-2">Directory</Link></li>
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
