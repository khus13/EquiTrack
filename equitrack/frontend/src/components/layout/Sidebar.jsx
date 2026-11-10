import { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { homePathFor, ROLE_LABEL } from '../../lib/constants.js';
import { IconUser, IconLogout, IconMenu, IconClose, IconChevronLeft, IconHome, IconChevronDown } from '../ui/Icons.jsx';

/**
 * Black sidebar (Account / Admin / Super Admin screens).
 * sections: [{ title?, items: [{ to, label, icon, end?, sub? }] }]
 * On phones it becomes a slide-down menu under a slim top bar.
 */
export default function Sidebar({ sections, backTo, showLogo = true, showHome = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({});

  const item = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${isActive ? 'bg-white/10 text-accent' : 'text-white hover:bg-white/5'}`;

  const content = (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      {showHome && <Link to={homePathFor(user)} aria-label="Home" title="Home" className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10 hover:text-accent">
        <IconHome className="h-5 w-5" />
      </Link>}
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
            {s.title && <p className="mb-1.5 px-3 text-tiny font-semibold tracking-wider text-muted">{s.title}</p>}
            <ul className="space-y-1">
              {s.items.map((it) => (
                <li key={it.to}>
                  {it.children ? (
                    <>
                      <button type="button" onClick={() => setExpanded((value) => ({ ...value, [it.to]: !value[it.to] }))}
                        aria-expanded={!!expanded[it.to] || it.children.some((child) => location.pathname === child.to)}
                        className={`${item({ isActive: it.children.some((child) => location.pathname === child.to) })} w-full`}>
                        {it.icon && <it.icon className="h-5 w-5 shrink-0" />}
                        <span className="flex-1 text-left">{it.label}</span>
                        <IconChevronDown className={`h-4 w-4 transition-transform ${expanded[it.to] || it.children.some((child) => location.pathname === child.to) ? 'rotate-180' : ''}`} />
                      </button>
                      {(expanded[it.to] || it.children.some((child) => location.pathname === child.to)) && (
                        <ul className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-3">
                          {it.children.map((child) => (
                            <li key={child.to}>
                              <NavLink to={child.to} end={child.end} onClick={() => setOpen(false)} className={item}>
                                <span>{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <NavLink to={it.to} end={it.end} onClick={() => setOpen(false)} className={item}>
                      {it.icon && <it.icon className="h-5 w-5 shrink-0" />}
                      <span>{it.label}</span>
                    </NavLink>
                  )}
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
          <Logo className="h-9" to={homePathFor(user)} />
          <button type="button" className="rounded-lg p-2 hover:bg-white/10" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>
        {open && <div className="max-h-[80vh] overflow-y-auto border-t border-surface-line">{content}</div>}
      </div>
    </>
  );
}
