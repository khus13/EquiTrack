/** Date helpers. The API sends UTC times like "2026-09-01 09:10:00". */

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const d = parseDate(value);
  return d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

export function formatDateTime(value) {
  const d = parseDate(value);
  return d
    ? d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
}

/** "5 min ago", "3 days ago" ... */
export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return '';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, secs] of units) {
    if (s >= secs) { const n = Math.floor(s / secs); return `${n} ${name}${n > 1 ? 's' : ''} ago`; }
  }
  return 'just now';
}

/** "Room, Building" */
export const placeOf = (r) => [r.room_name, r.building_name].filter(Boolean).join(', ');

/** 3 -> "3", 1234 -> "1,234" */
export const num = (n) => Number(n || 0).toLocaleString();

export function hoursToText(h) {
  if (h === null || h === undefined) return '—';
  if (h < 48) return `${h} h`;
  return `${(h / 24).toFixed(1)} days`;
}
