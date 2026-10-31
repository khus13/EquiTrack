import { IconAlert, IconCheck, IconInfo, IconInbox, IconRefresh } from './Icons.jsx';

/** Loading spinner */
export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" role="status" aria-label="Loading">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Pulsing grey block - the "skeleton loader" */
export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => <Skeleton key={c} className="h-5 flex-1" />)}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Nothing here yet */
export function EmptyState({ title = 'Nothing to show', hint, action, icon: Icon = IconInbox }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-4 rounded-full bg-white/5 p-4 text-muted"><Icon className="h-8 w-8" /></div>
      <h3 className="text-white">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-small text-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Something failed - with a retry button */
export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center" role="alert">
      <div className="mb-4 rounded-full bg-danger/20 p-4 text-danger-light"><IconAlert className="h-8 w-8" /></div>
      <h3>Could not load this</h3>
      <p className="mt-1 max-w-sm text-small text-muted">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-outline btn-sm mt-5"><IconRefresh className="h-4 w-4" /> Try again</button>
      )}
    </div>
  );
}

/** Inline message box: type = success | error | info | warning */
const ALERT = {
  success: ['border-primary bg-[#1f3306]', IconCheck, 'text-primary-light'],
  error: ['border-danger-light bg-[#3b0d1b]', IconAlert, 'text-danger-light'],
  info: ['border-secondary-300 bg-[#14214a]', IconInfo, 'text-secondary-300'],
  warning: ['border-status-pending bg-[#3a2b05]', IconAlert, 'text-status-pending'],
};
export function Alert({ type = 'info', title, children, className = '' }) {
  const [box, Icon, color] = ALERT[type];
  return (
    <div className={`flex gap-3 rounded-2xl border-2 px-4 py-3 ${box} ${className}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <div className="text-small">
        {title && <p className="font-semibold text-white">{title}</p>}
        <div className="text-neutral-200">{children}</div>
      </div>
    </div>
  );
}

/** Full-page loader (used while the session is being checked) */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="h-9 w-9 text-accent" />
      <p className="text-small">{label}</p>
    </div>
  );
}
