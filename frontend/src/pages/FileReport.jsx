import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const MAX = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function FileReport() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [meta, setMeta] = useState(null);
  const [f, setF] = useState({ title: '', category_id: '', description: '', building_id: '', location_id: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.meta().then(setMeta).catch((e) => setError(e.message)); }, []);
  const locations = useMemo(() => (meta && f.building_id ? meta.locations.filter((l) => String(l.building_id) === f.building_id) : []), [meta, f.building_id]);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value, ...(k === 'building_id' ? { location_id: '' } : {}) }));
  const pick = (e) => {
    const x = e.target.files[0];
    if (!x) return setFile(null);
    if (!TYPES.includes(x.type)) { setErrors((p) => ({ ...p, photo: 'Only JPG, PNG or WebP images are accepted.' })); e.target.value = ''; return setFile(null); }
    if (x.size > MAX) { setErrors((p) => ({ ...p, photo: 'Image exceeds 5MB.' })); e.target.value = ''; return setFile(null); }
    setErrors((p) => ({ ...p, photo: undefined })); setFile(x);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const local = {};
    if (!f.title.trim()) local.title = 'Required.';
    if (!f.category_id) local.category_id = 'Required.';
    if (!f.description.trim()) local.description = 'Required.';
    if (!f.building_id) local.building_id = 'Required.';
    if (!f.location_id) local.location_id = 'Required.';
    if (!file) local.photo = 'A photo of the item is required.';
    if (Object.keys(local).length) { setErrors(local); setBusy(false); return; }
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => form.append(k, v));
    form.append('photo', file);
    try { const d = await api.createReport(form); nav(`/reports/${d.report.id}`); }
    catch (err) { setErrors(err.errors || {}); setError(err.message); }
    finally { setBusy(false); }
  };
  const Req = () => <span className="req">*</span>;
  const Err = ({ k }) => (errors[k] ? <span className="field-error">{errors[k]}</span> : null);

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <div className="panel-inner">
        <h1 className="panel-title">Fill Out Form</h1>
        <h2 className="panel-sub">REPORTING A REPAIR?</h2>
        <p className="panel-text">Fill out this sheet with the necessary information Pertaining the item or infrastructure that is broken within the University of San Carlos Campus.</p>

        <div className="two-col">
          <div><label htmlFor="title">Name of Item <Req /></label><input id="title" className="pill sm" placeholder="e.g HDMI Port" maxLength={150} value={f.title} onChange={set('title')} /><Err k="title" /></div>
          <div><label htmlFor="cat">Category <Req /></label>
            <select id="cat" className="pill sm" value={f.category_id} onChange={set('category_id')}>
              <option value="">Select Category</option>
              {meta?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select><Err k="category_id" /></div>
        </div>

        <label htmlFor="desc">Description <Req /></label>
        <textarea id="desc" className="pill area" placeholder="Describe the equipment or facility that is broken and where it was found." value={f.description} onChange={set('description')} />
        <Err k="description" />

        <div className="two-col">
          <div><label htmlFor="bld">Building <Req /></label>
            <select id="bld" className="pill sm" value={f.building_id} onChange={set('building_id')}>
              <option value="">Select Building</option>
              {meta?.buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select><Err k="building_id" /></div>
          <div><label htmlFor="loc">Specific Location <Req /></label>
            <select id="loc" className="pill sm" value={f.location_id} onChange={set('location_id')} disabled={!f.building_id}>
              <option value="">{f.building_id ? 'Select Location' : 'Select a building first'}</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select><Err k="location_id" /></div>
        </div>

        <h3 className="upload-label">UPLOAD PHOTO <Req /></h3>
        <div className="upload-box">
          <div className="upload-bar">
            <button type="button" className="btn btn-dark-green choose" onClick={() => fileRef.current.click()}>Choose File</button>
            <span className="file-name">{file ? file.name : 'No Chosen File'}</span>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} hidden />
          </div>
          {preview && <img className="upload-preview" src={preview} alt="Selected upload preview" />}
          <p className="upload-note">To prevent spam and false reports, we require an image of the item. Max file size: 5MB. Accepted formats: JPG, PNG, WebP.</p>
          <Err k="photo" />
        </div>

        {error && <p className="form-error center" role="alert">{error}</p>}
        <div className="center"><button className="btn btn-green btn-submit" disabled={busy}>{busy ? 'SUBMITTING…' : 'SUBMIT FILE REPORT'}</button></div>
      </div>
    </form>
  );
}
