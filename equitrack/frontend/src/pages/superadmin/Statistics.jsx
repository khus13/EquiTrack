import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/api.js';
import { PageHeader, StatCard, BarList } from '../../components/ui/Data.jsx';
import { ErrorState } from '../../components/ui/Feedback.jsx';
import { hoursToText } from '../../lib/format.js';
import { IconClipboard, IconClock, IconWrench, IconCheck } from '../../components/ui/Icons.jsx';

export default function Statistics() {
  const { data: d, loading, error, reload } = useApi(() => api.get('/stats/overview'), []);
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  const maxMonth = Math.max(1, ...(d?.monthly || []).flatMap((m) => [m.created, m.solved]));

  return (
    <>
      <PageHeader title="Reports & statistics" subtitle="System-wide numbers for the whole campus." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total reports" tone="lime" icon={IconClipboard} value={d?.status_counts.total} loading={loading} />
        <StatCard label="Pending" tone="amber" icon={IconClock} value={d?.status_counts.Pending} loading={loading} />
        <StatCard label="In progress" tone="blue" icon={IconWrench} value={d?.status_counts['In Progress']} loading={loading} />
        <StatCard label="Solved" tone="green" icon={IconCheck} value={d?.status_counts.Solved} loading={loading} hint={d ? `Avg. time to solve: ${hoursToText(d.avg_resolution_hours)}` : undefined} />
      </div>

      {d && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="card lg:col-span-2" aria-labelledby="m-h">
            <h2 id="m-h" className="mb-1 text-h3">Reports per month</h2>
            <p className="mb-5 flex gap-4 text-small text-muted"><span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-accent align-middle" />Created</span><span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-status-progress align-middle" />Solved</span></p>
            <div className="flex h-48 items-end gap-3 sm:gap-6" role="img" aria-label={d.monthly.map((m) => `${m.label}: ${m.created} created, ${m.solved} solved`).join('; ')}>
              {d.monthly.map((m) => (
                <div key={m.label} className="flex h-full flex-1 flex-col justify-end">
                  <div className="flex flex-1 items-end justify-center gap-1">
                    <div className="w-1/2 max-w-[2rem] rounded-t bg-accent" style={{ height: `${(m.created / maxMonth) * 100}%`, minHeight: m.created ? 4 : 0 }} title={`${m.created} created`} />
                    <div className="w-1/2 max-w-[2rem] rounded-t bg-status-progress" style={{ height: `${(m.solved / maxMonth) * 100}%`, minHeight: m.solved ? 4 : 0 }} title={`${m.solved} solved`} />
                  </div>
                  <p className="mt-2 text-center text-tiny text-muted">{m.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card"><h2 className="mb-4 text-h3">By category</h2><BarList items={d.by_category} /></section>
          <section className="card"><h2 className="mb-4 text-h3">By priority</h2><BarList items={d.by_priority} colorClass="bg-status-urgent" /></section>
          <section className="card"><h2 className="mb-4 text-h3">By campus</h2><BarList items={d.by_campus} colorClass="bg-status-progress" /></section>
          <section className="card"><h2 className="mb-4 text-h3">Top buildings</h2><BarList items={d.by_building} colorClass="bg-status-progress" /></section>
          <section className="card"><h2 className="mb-4 text-h3">By damage type</h2><BarList items={d.by_damage} colorClass="bg-status-pending" /></section>
          <section className="card"><h2 className="mb-4 text-h3">Equipment condition</h2><BarList items={d.equipment_by_status} colorClass="bg-primary" /></section>
          <section className="card"><h2 className="mb-4 text-h3">Users by role</h2><BarList items={d.users_by_role} colorClass="bg-secondary-300" /></section>
        </div>
      )}
    </>
  );
}
