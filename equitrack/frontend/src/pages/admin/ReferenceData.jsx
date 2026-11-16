import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { api, ApiError } from '../../lib/api.js';
import { useMeta } from '../../context/MetaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader, DataTable, Pagination, SearchFilterBar } from '../../components/ui/Data.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { TextInput, Select } from '../../components/ui/Form.jsx';
import { Alert, EmptyState } from '../../components/ui/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import { IconPlus, IconEdit, IconTrash, IconDatabase } from '../../components/ui/Icons.jsx';

/**
 * Describes each reference table once. To add another table: add it here AND in backend models/Reference.php.
 *   cols   : table columns  [key, header]
 *   fields : form fields    { name, label, required?, select?: 'campuses' | 'buildings' | 'categories' }
 */
const RESOURCES = {
  campuses: { label: 'Campuses', single: 'campus', cols: [['name', 'Name'], ['code', 'Code'], ['address', 'Address']],
    fields: [{ name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code (e.g. TC)', required: true }, { name: 'address', label: 'Address' }] },
  buildings: { label: 'Buildings', single: 'building', cols: [['name', 'Name'], ['code', 'Code'], ['campus_name', 'Campus']],
    fields: [{ name: 'campus_id', label: 'Campus', select: 'campuses', required: true }, { name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code' }] },
  rooms: { label: 'Rooms', single: 'room', cols: [['name', 'Name'], ['floor', 'Floor'], ['building_name', 'Building']],
    fields: [{ name: 'building_id', label: 'Building', select: 'buildings', required: true }, { name: 'name', label: 'Room / location name', required: true }, { name: 'floor', label: 'Floor' }] },
  categories: { label: 'Categories', single: 'category', cols: [['name', 'Name'], ['description', 'Description']],
    fields: [{ name: 'name', label: 'Name', required: true }, { name: 'description', label: 'Description' }] },
  equipment_types: { label: 'Equipment types', single: 'equipment type', cols: [['name', 'Name'], ['category_name', 'Category']],
    fields: [{ name: 'category_id', label: 'Category', select: 'categories', required: true }, { name: 'name', label: 'Name', required: true }] },
  damage_types: { label: 'Damage types', single: 'damage type', cols: [['name', 'Name'], ['description', 'Description']],
    fields: [{ name: 'name', label: 'Name', required: true }, { name: 'description', label: 'Description' }] },
};
const PER_PAGE = 10;

export default function ReferenceData() {
  const { meta, reload: reloadMeta } = useMeta();
  const toast = useToast();
  const [tab, setTab] = useState('campuses');
  const cfg = RESOURCES[tab];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useApi(() => api.get(`/reference/${tab}`), [tab]);

  const [editing, setEditing] = useState(null);       // null | 'new' | row
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const switchTab = (key) => { setTab(key); setSearch(''); setPage(1); setEditing(null); };

  // client-side search + paging (reference tables are small)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data || []).filter((r) => !q || Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q)));
  }, [data, search]);
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pagination = { page, per_page: PER_PAGE, total: filtered.length, total_pages: Math.max(1, Math.ceil(filtered.length / PER_PAGE)) };

  const optionsFor = (kind) => {
    if (kind === 'campuses') return meta.campuses.map((c) => ({ value: c.id, label: c.name }));
    if (kind === 'categories') return meta.categories.map((c) => ({ value: c.id, label: c.name }));
    if (kind === 'buildings') return meta.buildings.map((b) => ({ value: b.id, label: `${b.name} — ${b.campus_name}` }));
    return [];
  };

  const openForm = (row) => {
    setEditing(row || 'new'); setErrors({}); setFormError('');
    setForm(Object.fromEntries(cfg.fields.map((f) => [f.name, row ? (row[f.name] ?? '') : ''])));
  };
  const save = async () => {
    setBusy(true); setFormError('');
    try {
      if (editing === 'new') await api.post(`/reference/${tab}`, form); else await api.put(`/reference/${tab}/${editing.id}`, form);
      toast.success(`${cfg.single[0].toUpperCase() + cfg.single.slice(1)} saved.`);
      setEditing(null); reload(); reloadMeta();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setErrors(e.errors); else setFormError(e.message);
    } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.del(`/reference/${tab}/${toDelete.id}`); toast.success('Deleted.'); setToDelete(null); reload(); reloadMeta(); }
    catch (e) { toast.error(e.message); setToDelete(null); }   // e.g. 409 "still in use"
    finally { setBusy(false); }
  };

  const columns = [
    ...cfg.cols.map(([key, header]) => ({ key, header, render: (r) => r[key] || <span className="text-muted">—</span> })),
    { key: 'act', header: <span className="sr-only">Actions</span>, className: 'text-right', render: (r) => (
      <div className="flex justify-end gap-1">
        <button type="button" onClick={() => openForm(r)} className="rounded-full p-2 hover:bg-white/10" aria-label={`Edit ${r.name}`}><IconEdit className="h-4 w-4" /></button>
        <button type="button" onClick={() => setToDelete(r)} className="rounded-full p-2 text-danger-light hover:bg-danger/20" aria-label={`Delete ${r.name}`}><IconTrash className="h-4 w-4" /></button>
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Reference data" subtitle="Lists used by the report form and the directory."
        breadcrumbs={[{ label: 'Super Admin', to: '/super-admin' }, { label: 'Reference data' }]}
        actions={<Button onClick={() => openForm(null)}><IconPlus className="h-5 w-5" /> Add {cfg.single}</Button>} />

      <div role="tablist" aria-label="Reference tables" className="mb-5 flex flex-wrap gap-2">
        {Object.entries(RESOURCES).map(([key, r]) => (
          <button key={key} role="tab" type="button" aria-selected={tab === key} onClick={() => switchTab(key)} className={`chip ${tab === key ? 'chip-active' : ''}`}>{r.label}</button>
        ))}
      </div>

      <SearchFilterBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={`Search ${cfg.label.toLowerCase()}…`} />
      <div role="tabpanel">
        <DataTable caption={cfg.label} columns={columns} rows={pageRows} loading={loading} error={error} onRetry={reload}
          empty={<EmptyState icon={IconDatabase} title={`No ${cfg.label.toLowerCase()} found`} hint="Add one with the button above." />} />
        <Pagination pagination={pagination} onPage={setPage} />
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`${editing === 'new' ? 'Add' : 'Edit'} ${cfg.single}`}
        footer={<><Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button><Button onClick={save} loading={busy}>Save</Button></>}>
        <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}
          {cfg.fields.map((f) => f.select
            ? <Select key={f.name} label={f.label} required={f.required} placeholder="Select…" value={form[f.name] ?? ''} options={optionsFor(f.select)} error={errors[f.name]}
                onChange={(e) => { setForm({ ...form, [f.name]: e.target.value }); setErrors({ ...errors, [f.name]: undefined }); }} />
            : <TextInput key={f.name} label={f.label} required={f.required} value={form[f.name] ?? ''} error={errors[f.name]}
                onChange={(e) => { setForm({ ...form, [f.name]: e.target.value }); setErrors({ ...errors, [f.name]: undefined }); }} />)}
        </form>
      </Modal>
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} danger loading={busy} confirmLabel="Delete" onConfirm={remove}
        title={`Delete this ${cfg.single}?`} message={`“${toDelete?.name}” will be removed. This fails if other records still use it.`} />
    </>
  );
}
