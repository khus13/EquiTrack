import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { statusClass } from '../components/ReportCard.jsx';

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [r, setR] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.report(id).then((d) => setR(d.report)).catch((e) => setError(e.message));
    api.meta().then(setMeta).catch(() => {});
  }, [id]);

  const change = async (e) => {
    try { const d = await api.setStatus(id, e.target.value); setR(d.report); } catch (err) { setError(err.message); }
  };

  if (error) return <div className="center-msg">{error} <Link className="green-link" to="/reports">Back</Link></div>;
  if (!r) return <div className="center-msg">Loading…</div>;

  return (
    <div className="panel">
      <div className="panel-inner detail">
        <Link to="/reports" className="green-link">← Back to results</Link>
        <h1 className="panel-title">{r.title}</h1>
        <p className={`card-status ${statusClass(r.status)} big`}>{r.status}</p>
        {r.image_url && <img className="detail-img" src={r.image_url} alt={r.title} />}
        <dl className="facts">
          <dt>Category</dt><dd>{r.category}</dd>
          <dt>Location</dt><dd>📌 {r.location}, {r.building}</dd>
          <dt>Reported by</dt><dd>{r.reporter}</dd>
          <dt>Filed</dt><dd>{new Date(r.created_at.replace(' ', 'T')).toLocaleString()}</dd>
        </dl>
        <h3 className="panel-sub">DESCRIPTION</h3>
        <p className="panel-text pre">{r.description}</p>
        {user.role === 'admin' && meta && (
          <div className="admin-box">
            <label htmlFor="st">Update status (admin)</label>
            <select id="st" className="pill sm" value={r.status} onChange={change}>{meta.statuses.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
        )}
      </div>
    </div>
  );
}
