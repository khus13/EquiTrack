import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { api, imageUrl, ApiError } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { hasRole } from '../lib/constants.js';
import { formatDateTime } from '../lib/format.js';
import { Breadcrumbs, Timeline } from '../components/ui/Data.jsx';
import { StatusBadge, PriorityTag } from '../components/ui/Badges.jsx';
import { ErrorState, Skeleton, Alert } from '../components/ui/Feedback.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Textarea } from '../components/ui/Form.jsx';
import Button from '../components/ui/Button.jsx';
import { IconCheck, IconWrench, IconRefresh, IconImage } from '../components/ui/Icons.jsx';

/** Shared by users (/reports/:id) and staff (/admin/reports/:id). Admin actions appear only for admins. */
export default function ReportDetail() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const isStaffView = pathname.startsWith('/admin');
  const canManage = hasRole(user, 'admin');
  const { data: r, loading, error, reload } = useApi(() => api.get(`/reports/${id}`), [id]);

  const [dialog, setDialog] = useState(null);      // 'Solved' | 'In Progress' | 'Pending' | null
  const [remarks, setRemarks] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const crumbs = isStaffView
    ? [{ label: 'Admin', to: '/admin' }, { label: 'Manage reports', to: '/admin/reports' }, { label: r?.reference_no || 'Report' }]
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

  if (error) return <div className="page"><Breadcrumbs items={crumbs} /><ErrorState message={error.status === 403 ? 'You do not have permission to view this report.' : error.status === 404 ? 'This report does not exist.' : error.message} onRetry={error.status ? undefined : reload} /></div>;
  if (loading || !r) {
    return (
      <div className="page space-y-4"><Skeleton className="h-6 w-64" /><Skeleton className="h-10 w-96" /><Skeleton className="h-64 w-full rounded-card" /></div>
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
          <p className="text-small text-muted">{r.reference_no}</p>
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
                <div key={k}><dt className="text-tiny font-semibold uppercase tracking-wide text-muted">{k}</dt><dd className="mt-0.5 break-words">{v}</dd></div>
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
    </div>
  );
}
