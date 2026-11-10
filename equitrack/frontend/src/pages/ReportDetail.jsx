import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { api, imageUrl, publicReportImageUrl, ApiError } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useMeta } from '../context/MetaContext.jsx';
import { hasRole } from '../lib/constants.js';
import { formatDateTime } from '../lib/format.js';
import { Breadcrumbs, Timeline } from '../components/ui/Data.jsx';
import { StatusBadge, PriorityTag } from '../components/ui/Badges.jsx';
import { ErrorState, Skeleton, Alert } from '../components/ui/Feedback.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Select, TextInput, Textarea } from '../components/ui/Form.jsx';
import LocationSelects from '../components/LocationSelects.jsx';
import Button from '../components/ui/Button.jsx';
import { IconCheck, IconWrench, IconRefresh, IconImage, IconEdit } from '../components/ui/Icons.jsx';

/** Shared by users (/reports/:id) and staff (/admin/reports/:id). Admin actions appear only for admins. */
export default function ReportDetail() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { meta } = useMeta();
  const toast = useToast();
  const isStaffView = pathname.startsWith('/admin');
  const canManage = hasRole(user, 'admin');
  const { data: reportView, loading, error, reload } = useApi(async () => {
    if (!user) {
      return { report: await api.get(`/public-reports/${id}`), publicView: true };
    }
    try {
      return { report: await api.get(`/reports/${id}`), publicView: false };
    } catch (requestError) {
      if (requestError.status !== 403) throw requestError;
      return { report: await api.get(`/public-reports/${id}`), publicView: true };
    }
  }, [id, user?.id]);
  const r = reportView?.report;
  const isPublicView = reportView?.publicView ?? false;
  const canEdit = canManage || (r?.user_id && Number(r.user_id) === Number(user?.id));

  const [dialog, setDialog] = useState(null);      // 'Solved' | 'In Progress' | 'Pending' | null
  const [remarks, setRemarks] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editError, setEditError] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const crumbs = isPublicView
    ? [{ label: 'Home', to: '/' }, { label: 'Equipment directory', to: '/directory' }, { label: r?.reference_no || 'Report Summary' }]
    : isStaffView
    ? [{ label: 'Admin', to: '/admin' }, { label: 'All reports', to: '/admin/reports' }, { label: r?.reference_no || 'Report' }]
    : [{ label: 'Dashboard', to: '/dashboard' }, { label: 'My reports', to: '/reports' }, { label: r?.reference_no || 'Report' }];

  const open = (status) => { setDialog(status); setRemarks(''); setRemarkError(''); };
  const save = async () => {
    setBusy(true); setRemarkError('');
    try {
      const res = await api.withMessage.patch(`/reports/${id}/status`, { status: dialog, remarks });
      toast.success(res.message);
      setDialog(null);
      reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setRemarkError(e.errors.remarks || e.errors.status || e.message);
      else toast.error(e.message);
    } finally { setBusy(false); }
  };

  const openEdit = () => {
    setEditValues({
      item_name: r.item_name,
      category_id: String(r.category_id),
      campus_id: String(r.campus_id),
      building_id: String(r.building_id),
      room_id: String(r.room_id),
      location_note: r.location_note || '',
      damage_type_id: String(r.damage_type_id),
      description: r.description,
      priority: r.priority,
    });
    setEditErrors({});
    setEditError('');
    setEditing(true);
  };
  const patchEdit = (patch) => {
    setEditValues((values) => ({ ...values, ...patch }));
    setEditErrors((errors) => {
      const next = { ...errors };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };
  const saveEdit = async () => {
    setEditBusy(true);
    setEditError('');
    try {
      const res = await api.withMessage.patch(`/reports/${id}`, editValues);
      toast.success(res.message);
      setEditing(false);
      reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setEditErrors(e.errors);
        setEditError(e.message);
      } else {
        setEditError(e.message);
      }
    } finally {
      setEditBusy(false);
    }
  };

  if (error) return <div className="page"><Breadcrumbs items={crumbs} /><ErrorState message={error.status === 403 ? 'You do not have permission to view this report.' : error.status === 404 ? 'This report does not exist.' : error.message} onRetry={error.status ? undefined : reload} /></div>;
  if (loading || !r) {
    return (
      <div className="page space-y-4"><Skeleton className="h-6 w-64" /><Skeleton className="h-10 w-96" /><Skeleton className="h-64 w-full rounded-card" /></div>
    );
  }

  if (isPublicView) {
    const publicDetails = [
      ['Category', r.category_name], ['Damage Type', r.damage_type_name],
      ['Campus', r.campus_name], ['Building', r.building_name],
      ['Room', r.room_name], ['Location Details', r.location_note || '—'],
      ...(r.equipment_name ? [['Linked Equipment', `${r.equipment_name}${r.asset_tag ? ` (${r.asset_tag})` : ''}`]] : []),
      ['Submitted', formatDateTime(r.created_at)],
    ];
    return (
      <div className="page">
        <Breadcrumbs items={crumbs} />
        <div className="mb-6">
          <p className="text-small text-muted" title="ET stands for EquiTrack">{r.reference_no}</p>
          <h1 className="break-words">{r.item_name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={r.status} />
            <PriorityTag priority={r.priority} />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card lg:col-span-2" aria-labelledby="public-report-details">
            <h2 id="public-report-details" className="mb-4 text-h3">Report Summary</h2>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {publicDetails.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-tiny font-semibold tracking-wide text-muted">{label}</dt>
                  <dd className="mt-0.5 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="card h-fit" aria-labelledby="public-report-photos">
            <h2 id="public-report-photos" className="mb-4 text-h3">Submitted Photos</h2>
            {r.images.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {r.images.map((image) => (
                  <a key={image.id} href={publicReportImageUrl(r.id, image.id)} target="_blank" rel="noreferrer"
                    aria-label="Open submitted photo in a new tab">
                    <img src={publicReportImageUrl(r.id, image.id)} alt={`Submitted photo for ${r.item_name}`}
                      className="max-h-72 rounded-2xl object-cover" />
                  </a>
                ))}
              </div>
            ) : <p className="flex items-center gap-2 text-small text-muted"><IconImage className="h-4 w-4" />No photo was attached.</p>}
          </section>
        </div>
      </div>
    );
  }

  const details = [
    ['Category', r.category_name], ['Damage type', r.damage_type_name],
    ['Campus', r.campus_name], ['Building', r.building_name],
    ['Room / location', r.room_name], ['Location details', r.location_note || '—'],
    ['Reported by', r.reporter_name], ['Submitted', formatDateTime(r.created_at)],
    ...(r.equipment_name ? [['Linked equipment', `${r.equipment_name} (${r.asset_tag})`]] : []),
    ...(r.status === 'Solved' ? [['Solved by', r.resolved_by_name || '—'], ['Solved on', formatDateTime(r.resolved_at)]] : []),
  ];

  const dialogCopy = {
    Solved: { title: 'Mark as solved', help: 'Describe what was done. The reporter will see these remarks.', cta: 'Mark as solved' },
    'In Progress': { title: 'Start work on this report', help: 'Optional note for the reporter (e.g. technician assigned).', cta: 'Set In Progress' },
    Pending: { title: 'Reopen this report', help: 'Say why the report is being reopened.', cta: 'Reopen' },
  }[dialog || 'Solved'];

  return (
    <div className="page">
      <Breadcrumbs items={crumbs} />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-small text-muted" title="ET stands for EquiTrack">{r.reference_no}</p>
          <h1 className="break-words">{r.item_name}</h1>
          <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={r.status} /><PriorityTag priority={r.priority} /></div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-3">
            {r.status === 'Pending' && <Button variant="outline" onClick={() => open('In Progress')}><IconWrench className="h-5 w-5" /> Start work</Button>}
            {r.status !== 'Solved' && <Button onClick={() => open('Solved')}><IconCheck className="h-5 w-5" /> Mark as solved</Button>}
            {r.status === 'Solved' && <Button variant="outline" onClick={() => open('Pending')}><IconRefresh className="h-5 w-5" /> Reopen</Button>}
          </div>
        )}
        {canEdit && (
          <Button variant="outline" onClick={openEdit}><IconEdit className="h-5 w-5" /> Edit report</Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card" aria-labelledby="desc-h">
            <h2 id="desc-h" className="mb-3 text-h3">Description</h2>
            <p className="whitespace-pre-wrap text-neutral-200">{r.description}</p>
            {r.images.length > 0 && !imgFailed ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {r.images.map((img) => (
                  <a key={img.id} href={imageUrl(img.id)} target="_blank" rel="noreferrer" aria-label="Open photo in a new tab">
                    <img src={imageUrl(img.id)} alt={`Photo of ${r.item_name}`} onError={() => setImgFailed(true)} className="max-h-72 rounded-2xl object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-5 flex items-center gap-2 text-small text-muted"><IconImage className="h-4 w-4" />{imgFailed ? 'The photo could not be loaded.' : 'No photo was attached.'}</p>
            )}
          </section>

          {r.remarks && (
            <Alert type={r.status === 'Solved' ? 'success' : 'info'} title="Admin remarks">{r.remarks}</Alert>
          )}

          <section className="card" aria-labelledby="det-h">
            <h2 id="det-h" className="mb-4 text-h3">Details</h2>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {details.map(([k, v]) => (
                <div key={k}><dt className="text-tiny font-semibold tracking-wide text-muted">{k}</dt><dd className="mt-0.5 break-words">{v}</dd></div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="card h-fit" aria-labelledby="tl-h">
          <h2 id="tl-h" className="mb-5 text-h3">Status timeline</h2>
          <Timeline history={r.history} />
        </aside>
      </div>

      <Modal open={!!dialog} onClose={() => setDialog(null)} title={dialogCopy.title}
        footer={<><Button variant="outline" onClick={() => setDialog(null)} disabled={busy}>Cancel</Button><Button onClick={save} loading={busy}>{dialogCopy.cta}</Button></>}>
        <p className="mb-4 text-neutral-200">{dialogCopy.help}</p>
        <Textarea label="Remarks" rows={4} maxLength={1000} value={remarks} onChange={(e) => setRemarks(e.target.value)} error={remarkError}
          placeholder={dialog === 'Solved' ? 'e.g. Replaced the faulty HDMI module.' : 'Optional'} />
      </Modal>

      <Modal open={editing} onClose={() => !editBusy && setEditing(false)} size="lg" title="Edit report"
        footer={<><Button variant="outline" onClick={() => setEditing(false)} disabled={editBusy}>Cancel</Button><Button onClick={saveEdit} loading={editBusy}>Save changes</Button></>}>
        {editError && <Alert type="error" className="mb-5">{editError}</Alert>}
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput label="Name of item" required maxLength={150} value={editValues.item_name || ''} error={editErrors.item_name} onChange={(e) => patchEdit({ item_name: e.target.value })} />
            <Select label="Category" required placeholder="Select category" value={editValues.category_id || ''} error={editErrors.category_id}
              options={meta.categories.map((c) => ({ value: c.id, label: c.name }))} onChange={(e) => patchEdit({ category_id: e.target.value })} />
          </div>
          <LocationSelects value={editValues} onChange={patchEdit} errors={editErrors} />
          <TextInput label="Location details" hint="Optional: floor, wall, seat number, near which door…" maxLength={190}
            value={editValues.location_note || ''} error={editErrors.location_note} onChange={(e) => patchEdit({ location_note: e.target.value })} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Type of damage" required placeholder="Select damage type" value={editValues.damage_type_id || ''} error={editErrors.damage_type_id}
              options={meta.damage_types.map((d) => ({ value: d.id, label: d.name }))} onChange={(e) => patchEdit({ damage_type_id: e.target.value })} />
            <Select label="Priority" required value={editValues.priority || ''} error={editErrors.priority}
              options={['Low', 'Medium', 'High', 'Urgent'].map((p) => ({ value: p, label: p }))} onChange={(e) => patchEdit({ priority: e.target.value })} />
          </div>
          <Textarea label="Description" required maxLength={2000} value={editValues.description || ''} error={editErrors.description}
            onChange={(e) => patchEdit({ description: e.target.value })} />
          <p className="text-small text-muted">Photos cannot be changed here; contact an administrator if a report photo needs replacing.</p>
        </div>
      </Modal>
    </div>
  );
}
