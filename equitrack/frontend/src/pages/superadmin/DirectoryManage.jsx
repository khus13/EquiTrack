import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery, useSearchBox } from '../../hooks/useListQuery.js';
import { api, ApiError } from '../../lib/api.js';
import { useMeta } from '../../context/MetaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader, SearchFilterBar, FilterSelect, DataTable, Pagination } from '../../components/ui/Data.jsx';
import { EquipmentStatusBadge } from '../../components/ui/Badges.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { TextInput, Select, Textarea } from '../../components/ui/Form.jsx';
import { Alert, EmptyState } from '../../components/ui/Feedback.jsx';
import LocationSelects from '../../components/LocationSelects.jsx';
import Button from '../../components/ui/Button.jsx';
import { EQUIPMENT_STATUS_LABEL } from '../../lib/constants.js';
import { IconPlus, IconEdit, IconTrash, IconBox } from '../../components/ui/Icons.jsx';

const BLANK = { asset_tag: '', name: '', category_id: '', type_id: '', campus_id: '', building_id: '', room_id: '', status: 'operational', description: '' };

/** Super Admin: add / edit / delete equipment in the directory. */
export default function DirectoryManage() {
  const { meta } = useMeta();
  const toast = useToast();
  const { query, setQuery, reset } = useListQuery({ q: '', category_id: '', campus_id: '', status: '', page: 1 });
  const [text, setText] = useSearchBox(query, setQuery);
  const { data, loading, error, reload } = useApi(() => api.get('/equipment', { ...query, per_page: 10 }), [JSON.stringify(query)]);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const patch = (p) => { setForm((f) => ({ ...f, ...p })); setErrors((e) => { const n = { ...e }; Object.keys(p).forEach((k) => delete n[k]); return n; }); };
  const openForm = (e) => {
    setEditing(e || 'new'); setErrors({}); setFormError('');
    setForm(e ? { asset_tag: e.asset_tag, name: e.name, category_id: String(e.category_id), type_id: e.type_id ? String(e.type_id) : '',
      campus_id: String(e.campus_id), building_id: String(e.building_id), room_id: String(e.room_id), status: e.status, description: e.description || '' } : BLANK);
  };
  const save = async () => {
    setBusy(true); setFormError('');
    try {
      if (editing === 'new') await api.post('/equipment', form); else await api.put(`/equipment/${editing.id}`, form);
      toast.success('Equipment saved.'); setEditing(null); reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setErrors(e.errors); else setFormError(e.message);
    } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.del(`/equipment/${toDelete.id}`); toast.success('Equipment deleted.'); setToDelete(null); reload(); }
    catch (e) { toast.error(e.message); setToDelete(null); }
    finally { setBusy(false); }
  };

  const types = meta.equipment_types.filter((t) => String(t.category_id) === String(form.category_id));
  const columns = [
    { key: 'name', header: 'Equipment', render: (e) => <div className="min-w-[10rem]"><p className="font-semibold">{e.name}</p><p className="text-tiny text-muted">{e.asset_tag}</p></div> },
    { key: 'cat', header: 'Category / type', render: (e) => <div><p>{e.category_name}</p><p className="text-tiny text-muted">{e.type_name || '—'}</p></div> },
    { key: 'loc', header: 'Location', render: (e) => <div className="min-w-[10rem]"><p>{e.room_name}, {e.building_name}</p><p className="text-tiny text-muted">{e.campus_name}</p></div> },
    { key: 'status', header: 'Condition', render: (e) => <EquipmentStatusBadge status={e.status} /> },
    { key: 'open', header: 'Open reports', render: (e) => e.open_reports },
    { key: 'act', header: <span className="sr-only">Actions</span>, className: 'text-right', render: (e) => (
      <div className="flex justify-end gap-1">
        <button type="button" onClick={() => openForm(e)} className="rounded-full p-2 hover:bg-white/10" aria-label={`Edit ${e.name}`}><IconEdit className="h-4 w-4" /></button>
        <button type="button" onClick={() => setToDelete(e)} className="rounded-full p-2 text-danger-light hover:bg-danger/20" aria-label={`Delete ${e.name}`}><IconTrash className="h-4 w-4" /></button>
      </div>) },
  ];
  const filtered = ['q', 'category_id', 'campus_id', 'status'].some((k) => query[k]);

  return (
    <>
      <PageHeader title="Manage directory" subtitle="The list of equipment and facilities users can search and report on."
        breadcrumbs={[{ label: 'Super Admin', to: '/super-admin' }, { label: 'Directory' }]}
        actions={<Button onClick={() => openForm(null)}><IconPlus className="h-5 w-5" /> Add equipment</Button>} />
      <SearchFilterBar value={text} onChange={setText} placeholder="Search name, tag, room or building…" showReset={filtered} onReset={() => { setText(''); reset(); }}>
        <FilterSelect label="Category" placeholder="All categories" value={query.category_id} onChange={(v) => setQuery({ category_id: v })} options={meta.categories.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterSelect label="Campus" placeholder="All campuses" value={query.campus_id} onChange={(v) => setQuery({ campus_id: v })} options={meta.campuses.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterSelect label="Condition" placeholder="Any condition" value={query.status} onChange={(v) => setQuery({ status: v })} options={Object.entries(EQUIPMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
      </SearchFilterBar>
      <DataTable caption="Equipment" columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload}
        empty={<EmptyState icon={IconBox} title="No equipment found" hint={filtered ? 'Try clearing a filter.' : 'Add the first item with the button above.'} />} />
      <Pagination pagination={data?.pagination} onPage={(p) => setQuery({ page: p })} />

      <Modal open={!!editing} onClose={() => setEditing(null)} size="lg" title={editing === 'new' ? 'Add equipment' : 'Edit equipment'}
        footer={<><Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button><Button onClick={save} loading={busy}>Save</Button></>}>
        <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Asset tag" required hint="Letters, numbers and dashes, e.g. TC-LB-0001" value={form.asset_tag} error={errors.asset_tag} onChange={(e) => patch({ asset_tag: e.target.value })} />
            <TextInput label="Name" required value={form.name} error={errors.name} onChange={(e) => patch({ name: e.target.value })} />
            <Select label="Category" required placeholder="Select category" value={form.category_id} error={errors.category_id} options={meta.categories.map((c) => ({ value: c.id, label: c.name }))} onChange={(e) => patch({ category_id: e.target.value, type_id: '' })} />
            <Select label="Type" placeholder={form.category_id ? 'Select type (optional)' : 'Choose a category first'} disabled={!form.category_id} value={form.type_id} error={errors.type_id} options={types.map((t) => ({ value: t.id, label: t.name }))} onChange={(e) => patch({ type_id: e.target.value })} />
          </div>
          <LocationSelects value={form} onChange={patch} errors={errors} />
          <Select label="Condition" value={form.status} error={errors.status} options={Object.entries(EQUIPMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }))} onChange={(e) => patch({ status: e.target.value })} />
          <Textarea label="Description" rows={3} maxLength={1000} value={form.description} error={errors.description} onChange={(e) => patch({ description: e.target.value })} />
        </form>
      </Modal>
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} danger loading={busy} confirmLabel="Delete" onConfirm={remove}
        title="Delete this equipment?" message={`“${toDelete?.name}” (${toDelete?.asset_tag}) will be removed from the directory. Existing reports about it are kept.`} />
    </>
  );
}
