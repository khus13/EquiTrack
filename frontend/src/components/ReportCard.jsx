import { Link } from 'react-router-dom';

export const statusClass = (s) => (s === 'Resolved' ? 'st-resolved' : s === 'Work In Progress' ? 'st-wip' : 'st-unresolved');

export default function ReportCard({ r }) {
  return (
    <Link to={`/reports/${r.id}`} className="card">
      <div className="card-img">
        {r.image_url ? <img src={r.image_url} alt={r.title} loading="lazy" /> : <div className="img-ph">No photo</div>}
      </div>
      <h3>{r.title}</h3>
      <p className="card-loc"><span aria-hidden="true">📌</span> {r.location}, {r.building}</p>
      <p className={`card-status ${statusClass(r.status)}`}>{r.status}</p>
    </Link>
  );
}
