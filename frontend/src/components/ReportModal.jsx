import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Thumb, statusClass } from './ReportCard.jsx';

const STATUSES = ['Unresolved', 'Work In Progress', 'Resolved'];

export default function ReportModal({ report, onClose, onUpdated }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(report.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const changeStatus = async (next) => {
    setStatus(next);
    setSaving(true);
    setError('');
    try {
      const d = await api.updateStatus(report.id, next);
      onUpdated(d.report);
    } catch (err) {
      setStatus(report.status);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={report.item_name} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <Thumb src={report.photo_path} alt={report.item_name} />
        <div className="modal-body">
          <h2>{report.item_name}</h2>
          <p className={`status ${statusClass(status)}`}>{status}</p>
          <dl>
            <dt>Category</dt><dd>{report.category}</dd>
            <dt>Location</dt><dd>{report.location}, {report.building}</dd>
            <dt>Reported by</dt><dd>{report.reporter || 'Anonymous'}</dd>
            <dt>Filed on</dt><dd>{new Date(report.created_at.replace(' ', 'T')).toLocaleString()}</dd>
          </dl>
          <p className="modal-desc">{report.description}</p>

          {user.role === 'admin' && (
            <label className="admin-status">
              Update status
              <select className="pill-input" value={status} disabled={saving} onChange={(e) => changeStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
