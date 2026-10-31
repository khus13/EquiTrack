import { Link } from 'react-router-dom';
import { StatusBadge, PriorityTag } from './ui/Badges.jsx';
import { imageUrl } from '../lib/api.js';
import { IconImage, IconPin, IconChevronRight } from './ui/Icons.jsx';
import { formatDate, placeOf } from '../lib/format.js';

/** One report as a dark row card (used on dashboards and My Reports). `base` = '/reports' or '/admin/reports' */
export default function ReportRow({ report, base = '/reports', showReporter = false, actions = null }) {
  return (
    <li className="flex flex-wrap items-center gap-2">
      <Link to={`${base}/${report.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl bg-surface-sunken p-3 transition hover:bg-white/10">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-raised text-muted">
          {report.image_id
            ? <img src={imageUrl(report.image_id)} alt="" loading="lazy" className="h-full w-full object-cover" />
            : <IconImage className="h-7 w-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-h3">{report.item_name}</p>
          <p className="flex items-center gap-1.5 truncate text-small text-muted"><IconPin className="h-4 w-4 shrink-0" />{placeOf(report)}</p>
          <p className="text-tiny text-muted">{report.reference_no} · {formatDate(report.created_at)}{showReporter && ` · ${report.reporter_name}`}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={report.status} />
          <PriorityTag priority={report.priority} />
        </div>
        <IconChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </Link>
      {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
    </li>
  );
}
