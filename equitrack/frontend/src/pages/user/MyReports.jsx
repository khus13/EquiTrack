import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery, useSearchBox } from '../../hooks/useListQuery.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader, SearchFilterBar, FilterSelect, Pagination } from '../../components/ui/Data.jsx';
import { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import ReportRow from '../../components/ReportRow.jsx';
import { STATUSES } from '../../lib/constants.js';
import { IconClipboard, IconTrash, IconEye, IconPlus } from '../../components/ui/Icons.jsx';

export default function MyReports() {
  const toast = useToast();
  const { query, setQuery, reset } = useListQuery({ q: '', status: '', page: 1 });
  const [search, setSearch] = useSearchBox(query, setQuery);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useApi(
    () => api.get('/reports', { q: query.q, status: query.status, page: query.page, per_page: 8 }),
    [query.q, query.status, query.page]
  );

  const confirmDelete = async () => {
    setDeleting(true);
    try { await api.del(`/reports/${toDelete.id}`); toast.success('Report deleted.'); setToDelete(null); reload(); }
    catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  const filtered = query.q || query.status;
  return (
    <div className="page">
      <PageHeader title="My reports" subtitle="Browse and follow the reports you filed."
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My reports' }]}
        actions={<Button to="/reports/new"><IconPlus className="h-5 w-5" /> New report</Button>} />

      <SearchFilterBar value={search} onChange={setSearch} placeholder="Search your reports…" showReset={!!filtered}
        onReset={() => { setSearch(''); reset(); }}>
        <FilterSelect label="Status" placeholder="All statuses" value={query.status} onChange={(v) => setQuery({ status: v })} options={STATUSES.map((s) => ({ value: s, label: s }))} />
      </SearchFilterBar>

      {error ? <ErrorState message={error.message} onRetry={reload} />
        : loading && !data ? <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
        : data.items.length === 0
          ? <EmptyState icon={IconClipboard} title={filtered ? 'No matching reports' : 'No reports yet'}
              hint={filtered ? 'Try a different search or clear the filters.' : 'Reports you file will show up here with their status.'}
              action={!filtered && <Button to="/reports/new">File a report</Button>} />
          : (
            <>
              <ul className="space-y-3">
                {data.items.map((r) => (
                  <ReportRow key={r.id} report={r} actions={<>
                    <Link to={`/reports/${r.id}`} className="rounded-full p-2 text-muted hover:bg-white/10 hover:text-white" aria-label={`View ${r.item_name}`}><IconEye /></Link>
                    {r.status === 'Pending' && (
                      <button type="button" onClick={() => setToDelete(r)} className="rounded-full p-2 text-danger-light hover:bg-danger/20" aria-label={`Delete ${r.item_name}`}><IconTrash /></button>
                    )}
                  </>} />
                ))}
              </ul>
              <Pagination pagination={data.pagination} onPage={(p) => setQuery({ page: p })} />
            </>
          )}

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} danger loading={deleting} confirmLabel="Delete report"
        title="Delete this report?" message={`“${toDelete?.item_name}” will be removed permanently. Only Pending reports can be deleted.`} onConfirm={confirmDelete} />
    </div>
  );
}
