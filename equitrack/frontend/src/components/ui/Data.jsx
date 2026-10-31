import { Link } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight, IconSearch, IconClose, IconSort } from './Icons.jsx';
import { TableSkeleton, EmptyState, ErrorState } from './Feedback.jsx';
import { formatDateTime } from '../../lib/format.js';
import { StatusBadge } from './Badges.jsx';

/** Page heading with optional breadcrumbs and action buttons. */
export function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <header className="mb-6">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}

/** items: [{label, to?}]  - the last item is the current page */
export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-small text-muted">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <IconChevronRight className="h-3.5 w-3.5" />}
            {it.to && i < items.length - 1
              ? <Link to={it.to} className="hover:text-white hover:underline">{it.label}</Link>
              : <span aria-current={i === items.length - 1 ? 'page' : undefined} className={i === items.length - 1 ? 'text-white' : ''}>{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Big number tile for dashboards. tone: amber | blue | green | red | lime */
const TONES = {
  amber: 'text-status-pending border-status-pending/40',
  blue: 'text-[#7fb0ff] border-status-progress/40',
  green: 'text-primary-light border-status-solved/50',
  red: 'text-danger-light border-status-urgent/50',
  lime: 'text-accent border-accent/40',
};
export function StatCard({ label, value, hint, tone = 'lime', icon: Icon, to, loading }) {
  const body = (
    <div className={`h-full rounded-card border-2 bg-surface-raised p-5 transition ${TONES[tone]} ${to ? 'hover:bg-white/5' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-small font-medium text-muted">{label}</p>
        {Icon && <Icon className="h-5 w-5 opacity-80" />}
      </div>
      <p className="mt-2 font-display text-[2.5rem] font-bold leading-none">
        {loading ? <span className="inline-block h-9 w-14 animate-pulse rounded bg-white/10 align-middle" aria-label="Loading" /> : value}
      </p>
      {hint && <p className="mt-2 text-tiny text-muted">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block rounded-card">{body}</Link> : body;
}

/** Search box + filters row. children = extra <select>s etc. */
export function SearchFilterBar({ value, onChange, placeholder = 'Search…', children, onReset, showReset }) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center" role="search">
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
               className="w-full rounded-pill border-2 border-transparent bg-surface-sunken py-3 pl-12 pr-4 text-white placeholder:text-muted focus:border-accent" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {showReset && <button type="button" onClick={onReset} className="btn btn-ghost btn-sm"><IconClose className="h-4 w-4" /> Reset</button>}
      </div>
    </div>
  );
}

/** Small <select> used inside SearchFilterBar. */
export function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
            className="input w-auto min-w-[9rem] py-2 text-small">
      <option value="">{placeholder || label}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/**
 * Pagination: "Showing 1-10 of 42" + Previous / page numbers / Next.
 * pagination = { page, per_page, total, total_pages } straight from the API.
 */
export function Pagination({ pagination, onPage }) {
  if (!pagination) return null;
  const { page, per_page, total, total_pages } = pagination;
  if (total === 0) return null;
  const from = (page - 1) * per_page + 1;
  const to = Math.min(total, page * per_page);

  // show first, last, current and its neighbours
  const pages = [];
  for (let p = 1; p <= total_pages; p++) {
    if (p === 1 || p === total_pages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const btn = 'inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full px-3 text-small font-medium transition';
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-small text-muted">Showing <strong className="text-white">{from}–{to}</strong> of <strong className="text-white">{total}</strong></p>
      <ul className="flex items-center gap-1">
        <li><button type="button" className={`${btn} text-white hover:bg-white/10 disabled:opacity-40`} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><IconChevronLeft className="h-4 w-4" /></button></li>
        {pages.map((p, i) => p === '…'
          ? <li key={`g${i}`} className="px-1 text-muted" aria-hidden="true">…</li>
          : <li key={p}><button type="button" onClick={() => onPage(p)} aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}
                className={`${btn} ${p === page ? 'bg-accent text-ink' : 'text-white hover:bg-white/10'}`}>{p}</button></li>)}
        <li><button type="button" className={`${btn} text-white hover:bg-white/10 disabled:opacity-40`} disabled={page >= total_pages} onClick={() => onPage(page + 1)} aria-label="Next page"><IconChevronRight className="h-4 w-4" /></button></li>
      </ul>
    </nav>
  );
}

/**
 * DataTable
 *  columns: [{ key, header, render?(row), sortKey?, className? }]
 *  sort: { key, dir }  +  onSort(sortKey)
 * Shows skeleton rows while loading, an error state, or an empty state.
 */
export function DataTable({ columns, rows, rowKey = 'id', loading, error, onRetry, sort, onSort, empty, caption }) {
  if (error) return <div className="table-wrap"><ErrorState message={error.message || String(error)} onRetry={onRetry} /></div>;
  return (
    <div className="table-wrap">
      {loading && !rows?.length ? <TableSkeleton cols={Math.min(columns.length, 6)} /> : (
        !rows?.length ? (empty || <EmptyState title="No results" hint="Try a different search or filter." />) : (
          <table className={`table ${loading ? 'opacity-60' : ''}`} aria-busy={loading || undefined}>
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr>
                {columns.map((c) => {
                  const active = sort && c.sortKey && sort.key === c.sortKey;
                  return (
                    <th key={c.key} scope="col" className={c.className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                      {c.sortKey && onSort ? (
                        <button type="button" onClick={() => onSort(c.sortKey)} className="inline-flex items-center gap-1 hover:text-white">
                          {c.header}<IconSort className={`h-3.5 w-3.5 ${active ? 'text-accent' : 'opacity-50'}`} />
                        </button>
                      ) : c.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[rowKey]}>
                  {columns.map((c) => <td key={c.key} className={c.className}>{c.render ? c.render(row) : row[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

/** Vertical status timeline. history = [{new_status, old_status, remarks, created_at, changed_by_name}] */
const DOT = { Pending: 'bg-status-pending', 'In Progress': 'bg-status-progress', Solved: 'bg-status-solved' };
export function Timeline({ history = [] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-surface-line pl-7" aria-label="Status timeline">
      {history.map((h, i) => (
        <li key={h.id} className="relative">
          <span className={`absolute -left-[2.2rem] top-1 h-4 w-4 rounded-full ring-4 ring-surface-raised ${DOT[h.new_status] || 'bg-muted'}`} aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={h.new_status} />
            {i === history.length - 1 && <span className="text-tiny font-semibold uppercase tracking-wide text-accent">Current</span>}
          </div>
          <p className="mt-1 text-tiny text-muted">{formatDateTime(h.created_at)} · {h.changed_by_name}</p>
          {h.remarks && <p className="mt-1.5 rounded-xl bg-surface-sunken px-3 py-2 text-small text-neutral-200">{h.remarks}</p>}
        </li>
      ))}
    </ol>
  );
}

/** Simple horizontal bar list for statistics: items = [{label, count}] */
export function BarList({ items = [], colorClass = 'bg-accent' }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.length) return <p className="text-small text-muted">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between gap-3 text-small"><span className="truncate">{i.label}</span><span className="font-semibold">{i.count}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-sunken" role="img" aria-label={`${i.label}: ${i.count}`}>
            <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
