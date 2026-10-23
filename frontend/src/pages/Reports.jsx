import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ReportCard from '../components/ReportCard.jsx';

function FilterGroup({ title, options, value, onChange, kind = 'list' }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="filter-group">
      <h3>{title}</h3>
      {kind === 'list' ? (
        <div className="filter-box">
          <button type="button" className="chev" onClick={() => setOpen(!open)} aria-label={`Toggle ${title}`} aria-expanded={open}>
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" style={{ transform: open ? 'none' : 'rotate(180deg)' }}><path d="M3 11l8-8 8 8" /></svg>
          </button>
          {(open ? options : options.filter((o) => o.value === value)).map((o) => (
            <button type="button" key={o.value} className={'opt' + (value === o.value ? ' active' : '')} onClick={() => onChange(value === o.value ? '' : o.value)} aria-pressed={value === o.value}>{o.label}</button>
          ))}
        </div>
      ) : (
        <div className="chips">
          {options.map((o) => (
            <button type="button" key={o.value} className={'chip' + (value === o.value ? ' active' : '')} onClick={() => onChange(value === o.value ? '' : o.value)} aria-pressed={value === o.value}>{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState({ count: 0, reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const status = params.get('status') || '';
  const building = params.get('building') || '';
  const mine = params.get('mine') || '';

  useEffect(() => { api.meta().then(setMeta).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.reports({ q, category, status, building, mine })
      .then((d) => { if (alive) { setData(d); setError(''); } })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, category, status, building, mine]);

  const setParam = (k) => (v) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n); };

  return (
    <div className="browse">
      <aside className="filters">
        <div className="filters-head">
          <h2>Filters</h2>
          <button className="reset" onClick={() => setParams({})}>Reset</button>
        </div>
        {meta && (
          <>
            <FilterGroup title="Case Type" value={category} onChange={setParam('category')} options={meta.categories.map((c) => ({ value: String(c.id), label: c.name }))} />
            <FilterGroup title="Case Status" value={status} onChange={setParam('status')} options={meta.statuses.map((s) => ({ value: s, label: s }))} />
            <FilterGroup title="Location" kind="chips" value={building} onChange={setParam('building')} options={meta.buildings.map((b) => ({ value: String(b.id), label: b.name }))} />
          </>
        )}
      </aside>
      <div className="divider" />
      <section className="results">
        <h1>{mine ? 'My Reports – ' : ''}{loading ? 'Loading…' : `${data.count} Result${data.count === 1 ? '' : 's'}`}</h1>
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && data.count === 0 && <p className="muted">No reports match your search. Try resetting the filters.</p>}
        <div className="grid">{data.reports.map((r) => <ReportCard key={r.id} r={r} />)}</div>
      </section>
    </div>
  );
}
