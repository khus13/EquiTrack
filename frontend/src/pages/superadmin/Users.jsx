import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery, useSearchBox } from '../../hooks/useListQuery.js';
import { api, ApiError } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader, SearchFilterBar, FilterSelect, DataTable, Pagination } from '../../components/ui/Data.jsx';
import { RoleBadge, ActiveBadge } from '../../components/ui/Badges.jsx';
import { Modal, ConfirmDialog } from '../../components/ui/Modal.jsx';
import { TextInput, PasswordInput, Select } from '../../components/ui/Form.jsx';
import { Alert, EmptyState } from '../../components/ui/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatDate } from '../../lib/format.js';
import { ROLE_LABEL } from '../../lib/constants.js';
import { IconPlus, IconEdit, IconTrash, IconUsers } from '../../components/ui/Icons.jsx';

const BLANK = { first_name: '', last_name: '', email: '', password: '', role: 'user', status: 'active' };

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { query, setQuery, reset } = useListQuery({ q: '', role: '', status: '', page: 1 });
  const [text, setText] = useSearchBox(query, setQuery);
  const { data, loading, error, reload } = useApi(() => api.get('/users', { ...query, per_page: 10 }), [JSON.stringify(query)]);

  const [editing, setEditing] = useState(null);     // null | 'new' | user object
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const openForm = (u) => {
    setEditing(u || 'new'); setErrors({}); setFormError('');
    setForm(u ? { first_name: u.first_name, last_name: u.last_name, email: u.email, password: '', role: u.role, status: u.status } : BLANK);
  };
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const save = async () => {
    setBusy(true); setFormError('');
    try {
      if (editing === 'new') await api.post('/users', form); else await api.put(`/users/${editing.id}`, form);
      toast.success(editing === 'new' ? 'User created.' : 'User updated.');
      setEditing(null); reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setErrors(e.errors); else setFormError(e.message);
    } finally { setBusy(false); }
  };

  const toggle = async (u) => {
    try { await api.patch(`/users/${u.id}/status`, { status: u.status === 'active' ? 'inactive' : 'active' }); toast.success('Status updated.'); reload(); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.del(`/users/${toDelete.id}`); toast.success('User deleted.'); setToDelete(null); reload(); }
    catch (e) { toast.error(e.message); setToDelete(null); }
    finally { setBusy(false); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (u) => <div><p className="font-semibold">{u.full_name}{u.id === me.id && <span className="ml-2 text-tiny text-accent">(you)</span>}</p><p className="text-tiny text-muted">{u.email}</p></div> },
    { key: 'role', header: 'Role', render: (u) => <RoleBadge role={u.role} /> },
    { key: 'status', header: 'Status', render: (u) => <ActiveBadge status={u.status} /> },
    { key: 'created', header: 'Joined', render: (u) => formatDate(u.created_at) },
    { key: 'act', header: <span className="sr-only">Actions</span>, className: 'text-right', render: (u) => (
      <div className="flex justify-end gap-1">
        <button type="button" onClick={() => toggle(u)} className="btn btn-ghost btn-sm" disabled={u.id === me.id}>{u.status === 'active' ? 'Deactivate' : 'Activate'}</button>
        <button type="button" onClick={() => openForm(u)} className="rounded-full p-2 hover:bg-white/10" aria-label={`Edit ${u.full_name}`}><IconEdit className="h-4 w-4" /></button>
        <button type="button" onClick={() => setToDelete(u)} disabled={u.id === me.id} className="rounded-full p-2 text-danger-light hover:bg-danger/20 disabled:opacity-30" aria-label={`Delete ${u.full_name}`}><IconTrash className="h-4 w-4" /></button>
      </div>) },
  ];
  const filtered = query.q || query.role || query.status;

  return (
    <>
      <PageHeader title="Users" subtitle="View, add, edit and remove accounts." breadcrumbs={[{ label: 'Super Admin', to: '/super-admin' }, { label: 'Users' }]}
        actions={<Button onClick={() => openForm(null)}><IconPlus className="h-5 w-5" /> Add user</Button>} />
      <SearchFilterBar value={text} onChange={setText} placeholder="Search name or e-mail…" showReset={!!filtered} onReset={() => { setText(''); reset(); }}>
        <FilterSelect label="Role" placeholder="All roles" value={query.role} onChange={(v) => setQuery({ role: v })} options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))} />
        <FilterSelect label="Status" placeholder="Any status" value={query.status} onChange={(v) => setQuery({ status: v })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
      </SearchFilterBar>
      <DataTable caption="Users" columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload}
        empty={<EmptyState icon={IconUsers} title="No users found" hint="Try a different search." />} />
      <Pagination pagination={data?.pagination} onPage={(p) => setQuery({ page: p })} />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add user' : 'Edit user'}
        footer={<><Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button><Button onClick={save} loading={busy}>Save</Button></>}>
        <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="space-y-4">
          {formError && <Alert type="error">{formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="First name" required value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
            <TextInput label="Last name" required value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
          </div>
          <TextInput label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} />
          <PasswordInput label={editing === 'new' ? 'Password' : 'New password'} required={editing === 'new'} hint={editing === 'new' ? undefined : 'Leave empty to keep the current password.'} autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Role" value={form.role} onChange={set('role')} error={errors.role} options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))} />
            <Select label="Status" value={form.status} onChange={set('status')} error={errors.status} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} danger loading={busy} confirmLabel="Delete user" onConfirm={remove}
        title="Delete this user?" message={`${toDelete?.full_name} (${toDelete?.email}) and all of their reports will be removed permanently.`} />
    </>
  );
}
