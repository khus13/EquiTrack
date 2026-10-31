import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Select, TextInput, Textarea, FileUpload } from '../../components/ui/Form.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { Breadcrumbs } from '../../components/ui/Data.jsx';
import Button from '../../components/ui/Button.jsx';
import LocationSelects from '../../components/LocationSelects.jsx';
import { useMeta } from '../../context/MetaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiError } from '../../lib/api.js';
import { PRIORITIES } from '../../lib/constants.js';
import { validateReport } from '../../lib/validators.js';

const EMPTY = { item_name: '', category_id: '', campus_id: '', building_id: '', room_id: '', location_note: '',
  damage_type_id: '', description: '', priority: 'Medium', equipment_id: '' };

const PRIORITY_HINT = {
  Low: 'Cosmetic or minor issue.', Medium: 'Affects use, but there is a workaround.',
  High: 'Blocks a class or activity.', Urgent: 'Safety risk or major leak / outage.',
};

export default function SubmitReport() {
  const { meta, loading: metaLoading, error: metaError } = useMeta();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [values, setValues] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  // Coming from the directory ("Report a problem" button)? Pre-fill from that equipment.
  const equipmentId = params.get('equipment');
  useEffect(() => {
    if (!equipmentId) return;
    api.get(`/equipment/${equipmentId}`).then((e) => setValues((v) => ({
      ...v, equipment_id: String(e.id), item_name: e.name, category_id: String(e.category_id),
      campus_id: String(e.campus_id), building_id: String(e.building_id), room_id: String(e.room_id),
    }))).catch(() => {});
  }, [equipmentId]);

  const patch = (p) => { setValues((v) => ({ ...v, ...p })); setErrors((e) => { const n = { ...e }; Object.keys(p).forEach((k) => delete n[k]); return n; }); };
  const field = (k) => ({ value: values[k], error: errors[k], onChange: (e) => patch({ [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateReport(values, photo);
    setErrors(found);
    if (Object.keys(found).length) { setFormError('Please fix the highlighted fields.'); return; }

    const form = new FormData();                         // FormData is needed for the file upload
    Object.entries(values).forEach(([k, v]) => { if (v !== '') form.append(k, v.trim ? v.trim() : v); });
    if (photo) form.append('photo', photo);

    setBusy(true);
    try {
      const res = await api.withMessage.postForm('/reports', form);
      toast.success(`Report ${res.data.reference_no} submitted. Thank you!`);
      navigate(`/reports/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) { setErrors(err.errors); setFormError(err.message); }
      else setFormError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="page max-w-4xl">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'File a report' }]} />
      <div className="card sm:p-10">
        <h1>Fill out form</h1>
        <p className="mt-4 font-display font-semibold uppercase text-secondary-300">Reporting a repair?</p>
        <p className="mb-6 text-neutral-200">Fill out this sheet with the necessary information about the item or infrastructure that is broken within the University of San Carlos campus.</p>

        {metaError && <Alert type="error" className="mb-4">Could not load the form options: {metaError}</Alert>}
        {formError && <Alert type="error" className="mb-5">{formError}</Alert>}

        <form onSubmit={submit} noValidate className="space-y-5" aria-label="Submit a report" aria-busy={metaLoading || undefined}>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput label="Name of item" required placeholder="e.g. HDMI port" maxLength={150} {...field('item_name')} />
            <Select label="Category" required placeholder="Select category" options={meta.categories.map((c) => ({ value: c.id, label: c.name }))} {...field('category_id')} />
          </div>

          <LocationSelects value={values} onChange={patch} errors={errors} />
          <TextInput label="Location details" hint="Optional: floor, wall, seat number, near which door…" maxLength={190} {...field('location_note')} />

          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Type of damage" required placeholder="Select damage type" options={meta.damage_types.map((d) => ({ value: d.id, label: d.name }))} {...field('damage_type_id')} />
            <Select label="Priority" required hint={PRIORITY_HINT[values.priority]} options={PRIORITIES.map((p) => ({ value: p, label: p }))} {...field('priority')} />
          </div>

          <Textarea label="Description" required placeholder="Describe what is broken, what happens, and when you noticed it." maxLength={2000} {...field('description')} />
          <FileUpload file={photo} onChange={setPhoto} error={errors.photo} />

          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={busy}>Cancel</Button>
            <Button type="submit" size="lg" loading={busy} className="uppercase">Submit report</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
