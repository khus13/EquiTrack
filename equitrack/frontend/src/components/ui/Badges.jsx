import { EQUIPMENT_STATUS_LABEL, ROLE_LABEL } from '../../lib/constants.js';

/**
 * Colored labels. Color is NEVER the only signal: each badge also has a text label
 * (and a dot shape), so it works for color-blind users.
 */
const pill = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 text-tiny font-semibold';

const STATUS = {
  Pending:       { cls: 'bg-status-pending/15 text-[#f5b83d] ring-1 ring-status-pending/50', dot: 'bg-status-pending' },
  'In Progress': { cls: 'bg-status-progress/15 text-[#7fb0ff] ring-1 ring-status-progress/50', dot: 'bg-status-progress' },
  Solved:        { cls: 'bg-status-solved/15 text-primary-light ring-1 ring-status-solved/60', dot: 'bg-status-solved' },
};
export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.Pending;
  return <span className={`${pill} ${s.cls}`}><span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />{status}</span>;
}

const PRIORITY = {
  Low:    'bg-white/10 text-neutral-200 ring-1 ring-white/20',
  Medium: 'bg-secondary/25 text-secondary-300 ring-1 ring-secondary-300/40',
  High:   'bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/50',
  Urgent: 'bg-status-urgent/20 text-danger-light ring-1 ring-status-urgent/70',
};
export function PriorityTag({ priority }) {
  return (
    <span className={`${pill} ${PRIORITY[priority] || PRIORITY.Low} ${priority === 'Urgent' ? 'uppercase tracking-wide' : ''}`}>
      {priority === 'Urgent' && <span aria-hidden="true">▲</span>}{priority}
    </span>
  );
}

const EQ = {
  operational: 'bg-status-solved/15 text-primary-light ring-1 ring-status-solved/60',
  needs_repair: 'bg-status-pending/15 text-[#f5b83d] ring-1 ring-status-pending/50',
  under_repair: 'bg-status-progress/15 text-[#7fb0ff] ring-1 ring-status-progress/50',
  retired: 'bg-white/10 text-neutral-300 ring-1 ring-white/20',
};
export function EquipmentStatusBadge({ status }) {
  return <span className={`${pill} ${EQ[status] || EQ.retired}`}>{EQUIPMENT_STATUS_LABEL[status] || status}</span>;
}

export function RoleBadge({ role }) {
  const cls = role === 'super_admin' ? 'bg-accent/20 text-accent ring-1 ring-accent/50'
    : role === 'admin' ? 'bg-secondary/25 text-secondary-300 ring-1 ring-secondary-300/40'
    : 'bg-white/10 text-neutral-200 ring-1 ring-white/20';
  return <span className={`${pill} ${cls}`}>{ROLE_LABEL[role] || role}</span>;
}

export function ActiveBadge({ status }) {
  return status === 'active'
    ? <span className={`${pill} bg-status-solved/15 text-primary-light ring-1 ring-status-solved/60`}>Active</span>
    : <span className={`${pill} bg-status-urgent/15 text-danger-light ring-1 ring-status-urgent/60`}>Inactive</span>;
}
