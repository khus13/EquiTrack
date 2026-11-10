import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery, useSearchBox } from '../../hooks/useListQuery.js';
import { api, imageUrl } from '../../lib/api.js';
import { useMeta } from '../../context/MetaContext.jsx';
import { PageHeader, SearchFilterBar, FilterSelect, DataTable, Pagination } from '../../components/ui/Data.jsx';
import { StatusBadge, PriorityTag } from '../../components/ui/Badges.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { PAGE_SIZE, STATUSES, PRIORITIES } from '../../lib/constants.js';
import { formatDate, placeOf } from '../../lib/format.js';
import { IconClipboard, IconImage } from '../../components/ui/Icons.jsx';

/** Report management table: search, filter, sort, paginate. Everything lives in the URL. */
export default function ManageReports() {
  const { meta } = useMeta();
  const { query, setQuery, reset } = useListQuery({ q: '', status: '', priority: '', category_id: '', campus_id: '', sort: 'created_at', dir: 'desc', page: 1 });
  const [text, setText] = useSearchBox(query, setQuery);

  const { data, loading, error, reload } = useApi(() => api.get('/reports', { ...query, per_page: PAGE_SIZE }), [JSON.stringify(query)]);

  // click a header: same column flips direction, new column starts descending (priority starts "asc" = Urgent first)
  const onSort = (key) => setQuery(query.sort === key
    ? { sort: key, dir: query.dir === 'asc' ? 'desc' : 'asc', page: 1 }
    : { sort: key, dir: key === 'priority' || key === 'item_name' ? 'asc' : 'desc', page: 1 });

  const columns = [
    { key: 'item', header: 'Item', sortKey: 'item_name', render: (r) => (
      <div className="flex min-w-[13rem] items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised text-muted">
          {r.image_id ? <img src={imageUrl(r.image_id)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <IconImage className="h-5 w-5" />}
        </div>
        <div className="min-w-0"><Link to={`/admin/reports/${r.id}`} className="font-semibold text-white hover:text-accent hover:underline">{r.item_name}</Link><p className="text-tiny text-muted">{r.reference_no}</p></div>
      </div>) },
    { key: 'place', header: 'Location', render: (r) => <div className="min-w-[10rem]"><p>{placeOf(r)}</p><p className="text-tiny text-muted">{r.campus_name}</p></div> },
    { key: 'reporter', header: 'Reporter', render: (r) => r.reporter_name },
    { key: 'priority', header: 'Priority', sortKey: 'priority', render: (r) => <PriorityTag priority={r.priority} /> },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created', header: 'Submitted', sortKey: 'created_at', render: (r) => <span className="whitespace-nowrap">{formatDate(r.created_at)}</span> },
  ];

  const filtered = ['q', 'status', 'priority', 'category_id', 'campus_id'].some((k) => query[k]);
  return (
    <>
      <PageHeader title="All reports" subtitle="Search, filter and update every report." breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'All reports' }]} />
      <SearchFilterBar value={text} onChange={setText} placeholder="Search reports…" showReset={filtered} onReset={() => { setText(''); reset(); }}>
        <FilterSelect label="Status" placeholder="All statuses" value={query.status} onChange={(v) => setQuery({ status: v })} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        <FilterSelect label="Priority" placeholder="All priorities" value={query.priority} onChange={(v) => setQuery({ priority: v })} options={PRIORITIES.map((s) => ({ value: s, label: s }))} />
        <FilterSelect label="Category" placeholder="All categories" value={query.category_id} onChange={(v) => setQuery({ category_id: v })} options={meta.categories.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterSelect label="Campus" placeholder="All campuses" value={query.campus_id} onChange={(v) => setQuery({ campus_id: v })} options={meta.campuses.map((c) => ({ value: c.id, label: c.name }))} />
      </SearchFilterBar>

      <DataTable caption="Reports" columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload}
        sort={{ key: query.sort, dir: query.dir }} onSort={onSort}
        empty={<EmptyState icon={IconClipboard} title="No reports found" hint={filtered ? 'Try clearing a filter.' : 'Reports will appear here as users submit them.'} />} />
      <Pagination pagination={data?.pagination} onPage={(p) => setQuery({ page: p })} />
    </>
  );
}
