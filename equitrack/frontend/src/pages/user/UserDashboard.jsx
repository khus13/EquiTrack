import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatCard, PageHeader } from '../../components/ui/Data.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import ReportRow from '../../components/ReportRow.jsx';
import { IconClock, IconWrench, IconCheck, IconPlus, IconClipboard } from '../../components/ui/Icons.jsx';

export default function UserDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(() => api.get('/stats/me'), []);

  return (
    <div className="page">
      <PageHeader title={`Hello, ${user.first_name}!`} subtitle="Here is what is happening with your reports."
        actions={<Button to="/reports/new"><IconPlus className="h-5 w-5" /> File a report</Button>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" tone="amber" icon={IconClock} value={data?.counts.Pending} loading={loading} to="/reports?status=Pending" hint="Waiting to be picked up" />
        <StatCard label="In progress" tone="blue" icon={IconWrench} value={data?.counts['In Progress']} loading={loading} to="/reports?status=In%20Progress" hint="Being repaired" />
        <StatCard label="Solved" tone="green" icon={IconCheck} value={data?.counts.Solved} loading={loading} to="/reports?status=Solved" hint="Fixed and closed" />
      </div>

      <section className="mt-10" aria-labelledby="recent-h">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-h">Recent reports</h2>
          <Button to="/reports" variant="ghost" size="sm">View all</Button>
        </div>
        {error ? <ErrorState message={error.message} onRetry={reload} />
          : loading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
          : data.recent.length === 0
            ? <EmptyState icon={IconClipboard} title="No reports yet" hint="Found something broken on campus? Let us know and we will get it fixed." action={<Button to="/reports/new">File your first report</Button>} />
            : <ul className="space-y-3">{data.recent.map((r) => <ReportRow key={r.id} report={r} />)}</ul>}
      </section>
    </div>
  );
}
