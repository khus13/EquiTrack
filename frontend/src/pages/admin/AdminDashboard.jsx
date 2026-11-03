import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { PageHeader, StatCard } from '../../components/ui/Data.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { PriorityTag, StatusBadge } from '../../components/ui/Badges.jsx';
import Button from '../../components/ui/Button.jsx';
import ReportRow from '../../components/ReportRow.jsx';
import { IconClock, IconWrench, IconCheck, IconAlert, IconCheck as IconDone } from '../../components/ui/Icons.jsx';
import { placeOf, timeAgo } from '../../lib/format.js';

export default function AdminDashboard() {
  const { data, loading, error, reload } = useApi(() => api.get('/stats/dashboard'), []);
  const c = data?.counts;

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Everything that needs attention on campus."
        actions={<Button to="/admin/reports">Manage reports</Button>} />

      {error ? <ErrorState message={error.message} onRetry={reload} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Pending" tone="amber" icon={IconClock} value={c?.Pending} loading={loading} to="/admin/reports?status=Pending" hint="Waiting to be picked up" />
            <StatCard label="In progress" tone="blue" icon={IconWrench} value={c?.['In Progress']} loading={loading} to="/admin/reports?status=In%20Progress" hint="Being repaired" />
            <StatCard label="Solved" tone="green" icon={IconCheck} value={c?.Solved} loading={loading} to="/admin/reports?status=Solved" hint="Fixed and closed" />
            <StatCard label="Urgent & open" tone="red" icon={IconAlert} value={data?.urgent_open} loading={loading} to="/admin/reports?priority=Urgent" hint="Needs attention now" />
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-2">
            {/* ---- To Repair ---- */}
            <section aria-labelledby="repair-h" className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="repair-h" className="text-h3">To repair <span className="text-muted">· most urgent first</span></h2>
                <Link to="/admin/reports?sort=priority&dir=asc" className="link text-small">See all</Link>
              </div>
              {loading ? <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                : data.to_repair.length === 0
                  ? <EmptyState icon={IconDone} title="Nothing to repair" hint="All reports are solved. Nice work!" />
                  : (
                    <ol className="divide-y divide-surface-line">
                      {data.to_repair.map((r) => (
                        <li key={r.id}>
                          <Link to={`/admin/reports/${r.id}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-white/5">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{r.item_name}</p>
                              <p className="truncate text-small text-muted">{placeOf(r)} · {timeAgo(r.created_at)}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1"><PriorityTag priority={r.priority} /><StatusBadge status={r.status} /></div>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  )}
            </section>

            {/* ---- Recent ---- */}
            <section aria-labelledby="recent-h" className="card">
              <h2 id="recent-h" className="mb-4 text-h3">Recent reports</h2>
              {loading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
                : data.recent.length === 0 ? <EmptyState title="No reports yet" />
                : <ul className="space-y-3">{data.recent.map((r) => <ReportRow key={r.id} report={r} base="/admin/reports" showReporter />)}</ul>}
            </section>
          </div>
        </>
      )}
    </>
  );
}
