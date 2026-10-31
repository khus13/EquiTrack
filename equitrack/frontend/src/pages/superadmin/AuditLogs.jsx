import { useApi } from '../../hooks/useApi.js';
import { useListQuery, useSearchBox } from '../../hooks/useListQuery.js';
import { api } from '../../lib/api.js';
import { PageHeader, SearchFilterBar, FilterSelect, DataTable, Pagination } from '../../components/ui/Data.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { formatDateTime } from '../../lib/format.js';
import { IconShield } from '../../components/ui/Icons.jsx';

const GROUPS = [['auth.', 'Sign-in / sign-out'], ['report.', 'Reports'], ['user.', 'User management'], ['reference.', 'Reference data'], ['equipment.', 'Directory'], ['profile.', 'Account changes']];

/** Pick a text color per action family so the log is easy to scan. */
const tone = (a) => a.endsWith('failed') || a.endsWith('delete') ? 'text-danger-light' : a.startsWith('auth.') ? 'text-secondary-300' : a.endsWith('create') || a.endsWith('register') ? 'text-primary-light' : 'text-white';

export default function AuditLogs() {
  const { query, setQuery, reset } = useListQuery({ q: '', action: '', from: '', to: '', page: 1 });
  const [text, setText] = useSearchBox(query, setQuery);
  const { data, loading, error, reload } = useApi(() => api.get('/audit-logs', { ...query, per_page: 15 }), [JSON.stringify(query)]);

  const columns = [
    { key: 'when', header: 'When', render: (l) => <span className="whitespace-nowrap">{formatDateTime(l.created_at)}</span> },
    { key: 'who', header: 'User', render: (l) => l.user_name ? <div><p>{l.user_name}</p><p className="text-tiny text-muted">{l.email}</p></div> : <span className="text-muted">Anonymous</span> },
    { key: 'action', header: 'Action', render: (l) => <code className={`rounded bg-surface-sunken px-2 py-0.5 text-tiny ${tone(l.action)}`}>{l.action}</code> },
    { key: 'entity', header: 'Entity', render: (l) => l.entity_type ? `${l.entity_type}${l.entity_id ? ` #${l.entity_id}` : ''}` : '—' },
    { key: 'details', header: 'Details', render: (l) => l.details ? <span className="line-clamp-2 break-all text-tiny text-muted">{Object.entries(l.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}</span> : '—' },
    { key: 'ip', header: 'IP', render: (l) => <span className="text-tiny text-muted">{l.ip_address}</span> },
  ];
  const filtered = ['q', 'action', 'from', 'to'].some((k) => query[k]);

  return (
    <>
      <PageHeader title="Audit logs" subtitle="A permanent record of important actions in the system." breadcrumbs={[{ label: 'Super Admin', to: '/super-admin' }, { label: 'Audit logs' }]} />
      <SearchFilterBar value={text} onChange={setText} placeholder="Search action, user e-mail or details…" showReset={filtered} onReset={() => { setText(''); reset(); }}>
        <FilterSelect label="Action type" placeholder="All actions" value={query.action} onChange={(v) => setQuery({ action: v })} options={GROUPS.map(([value, label]) => ({ value, label }))} />
        <label className="flex items-center gap-2 text-small text-muted">From <input type="date" value={query.from} onChange={(e) => setQuery({ from: e.target.value })} className="input w-auto py-2 text-small" /></label>
        <label className="flex items-center gap-2 text-small text-muted">To <input type="date" value={query.to} onChange={(e) => setQuery({ to: e.target.value })} className="input w-auto py-2 text-small" /></label>
      </SearchFilterBar>
      <DataTable caption="Audit log" columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload}
        empty={<EmptyState icon={IconShield} title="No log entries" hint="Nothing matches these filters." />} />
      <Pagination pagination={data?.pagination} onPage={(p) => setQuery({ page: p })} />
    </>
  );
}
