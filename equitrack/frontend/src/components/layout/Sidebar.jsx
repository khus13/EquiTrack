import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABEL } from '../../lib/constants.js';
import { IconUser, IconLogout, IconMenu, IconClose, IconChevronLeft } from '../ui/Icons.jsx';

/**
 * Black sidebar (Account / Admin / Super Admin screens).
 * sections: [{ title?, items: [{ to, label, icon, end?, sub? }] }]
 * On phones it becomes a slide-down menu under a slim top bar.
 */
export default function Sidebar({ sections, backTo, showLogo = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const item = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${isActive ? 'bg-white/10 text-accent' : 'text-white hover:bg-white/5'}`;

  const content = (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      {backTo && (
        <Link to={backTo} className="flex items-center gap-2 font-display font-semibold hover:text-accent"><IconChevronLeft /> Back</Link>
      )}
      {user && (
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black"><IconUser className="h-6 w-6" /></span>
          <div className="min-w-0">
            <p className="truncate font-display font-semibold leading-tight">{user.full_name}</p>
            <p className="truncate text-tiny text-muted">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
      )}
      {showLogo && <div className="border-b border-white/80 pb-5"><Logo className="h-10" /></div>}
      <nav aria-label="Section" className="flex-1 space-y-5 overflow-y-auto">
        {sections.map((s, i) => (
          <div key={i}>
            {s.title && <p className="mb-1.5 px-3 text-tiny font-semibold uppercase tracking-wider text-muted">{s.title}</p>}
            <ul className="space-y-1">
              {s.items.map((it) => (
                <li key={it.to}>
                  <NavLink to={it.to} end={it.end} onClick={() => setOpen(false)} className={item}>
                    {it.icon && <it.icon className="h-5 w-5 shrink-0" />}
                    <span>{it.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <button type="button" onClick={async () => { await logout(); navigate('/'); }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-danger-light hover:bg-white/5">
        <IconLogout className="h-5 w-5" /> Log out
      </button>
    </div>
  );

  return (
    <>
      {/* desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-surface-nav lg:block">{content}</aside>
      {/* mobile */}
      <div className="sticky top-0 z-40 bg-surface-nav lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Logo className="h-9" />
          <button type="button" className="rounded-lg p-2 hover:bg-white/10" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>
        {open && <div className="max-h-[80vh] overflow-y-auto border-t border-surface-line">{content}</div>}
      </div>
    </>
  );
}
