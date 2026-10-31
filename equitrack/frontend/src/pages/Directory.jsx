import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { useListQuery, useSearchBox } from '../hooks/useListQuery.js';
import { api } from '../lib/api.js';
import { useMeta } from '../context/MetaContext.jsx';
import { EQUIPMENT_STATUS_LABEL } from '../lib/constants.js';
import { Breadcrumbs, Pagination } from '../components/ui/Data.jsx';
import { EquipmentStatusBadge } from '../components/ui/Badges.jsx';
import { EmptyState, ErrorState, CardSkeleton } from '../components/ui/Feedback.jsx';
import Button from '../components/ui/Button.jsx';
import { IconSearch, IconPin, IconBox, IconWrench } from '../components/ui/Icons.jsx';

/** A group of toggle chips; click an active chip again to clear it. */
function Chips({ title, items, field, query, setQuery }) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2 font-display text-h3 text-secondary-300">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const active = String(query[field]) === String(it.value);
          const value = active ? '' : it.value;
          // changing campus clears building; changing category clears type
          const patch = field === 'campus_id' ? { campus_id: value, building_id: '' }
            : field === 'category_id' ? { category_id: value, type_id: '' } : { [field]: value };
          return (
            <button key={it.value} type="button" aria-pressed={active} className={`chip ${active ? 'chip-active' : ''}`} onClick={() => setQuery(patch)}>
              {it.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Equipment directory: search + filters by category, campus, building, type and status. */
export default function Directory() {
  const { meta } = useMeta();
  const { query, setQuery, reset } = useListQuery({ q: '', category_id: '', campus_id: '', building_id: '', type_id: '', status: '', page: 1 });
  const [text, setText] = useSearchBox(query, setQuery);
  const [showFilters, setShowFilters] = useState(false);   // phones: filters start collapsed

  const { data, loading, error, reload } = useApi(() => api.get('/equipment', { ...query, per_page: 12 }), [JSON.stringify(query)]);

  const buildings = meta.buildings.filter((b) => !query.campus_id || String(b.campus_id) === String(query.campus_id));
  const types = meta.equipment_types.filter((t) => !query.category_id || String(t.category_id) === String(query.category_id));
  const hasFilters = ['q', 'category_id', 'campus_id', 'building_id', 'type_id', 'status'].some((k) => query[k]);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Equipment directory' }]} />
      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        {/* ---------- filters ---------- */}
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-h1 font-extrabold">Filters</h2>
            <div className="flex items-center gap-4">
              {hasFilters && <button type="button" onClick={() => { setText(''); reset(); }} className="font-display font-semibold text-primary hover:text-primary-light">Reset</button>}
              <button type="button" className="btn btn-outline btn-sm lg:hidden" aria-expanded={showFilters} aria-controls="filter-panel" onClick={() => setShowFilters((v) => !v)}>
                {showFilters ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div id="filter-panel" className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <Chips query={query} setQuery={setQuery} title="Category" field="category_id" items={meta.categories.map((c) => ({ value: c.id, label: c.name }))} />
          <Chips query={query} setQuery={setQuery} title="Campus" field="campus_id" items={meta.campuses.map((c) => ({ value: c.id, label: c.name }))} />
          <Chips query={query} setQuery={setQuery} title="Building" field="building_id" items={buildings.map((b) => ({ value: b.id, label: b.name }))} />
          <fieldset className="mb-6">
            <legend className="mb-2 font-display text-h3 text-secondary-300">Type</legend>
            <select aria-label="Equipment type" value={query.type_id} onChange={(e) => setQuery({ type_id: e.target.value })} className="input py-2.5">
              <option value="">All types</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-display text-h3 text-secondary-300">Condition</legend>
            <select aria-label="Condition" value={query.status} onChange={(e) => setQuery({ status: e.target.value })} className="input py-2.5">
              <option value="">Any condition</option>
              {Object.entries(EQUIPMENT_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </fieldset>
          </div>
        </aside>

        {/* ---------- results ---------- */}
        <section aria-live="polite">
          <div className="relative mb-5">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search by name, asset tag, building or room…" aria-label="Search the directory"
                   className="w-full rounded-pill border-2 border-transparent bg-surface-sunken py-3 pl-12 pr-4 text-white placeholder:text-muted focus:border-accent" />
          </div>
          <h1 className="mb-5 text-white">{data ? `${data.pagination.total} result${data.pagination.total === 1 ? '' : 's'}` : 'Directory'}</h1>

          {error ? <ErrorState message={error.message} onRetry={reload} />
            : loading && !data ? <CardSkeleton />
            : data.items.length === 0
              ? <EmptyState icon={IconBox} title="No equipment found" hint="Try removing a filter or searching for something else." action={hasFilters && <Button variant="outline" onClick={() => { setText(''); reset(); }}>Clear filters</Button>} />
              : (
                <>
                  <ul className={`grid gap-5 sm:grid-cols-2 2xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
                    {data.items.map((e) => (
                      <li key={e.id} className="flex flex-col rounded-card bg-surface-raised p-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunken text-accent"><IconBox /></span>
                          <EquipmentStatusBadge status={e.status} />
                        </div>
                        <h3 className="break-words font-display">{e.name}</h3>
                        <p className="text-tiny text-muted">{e.asset_tag} · {e.type_name || e.category_name}</p>
                        <p className="mt-2 flex items-start gap-1.5 text-small text-neutral-200"><IconPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />{e.room_name}, {e.building_name} · {e.campus_name}</p>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                          {e.open_reports > 0
                            ? <span className="flex items-center gap-1.5 whitespace-nowrap text-small font-semibold text-[#f5b83d]"><IconWrench className="h-4 w-4" />{e.open_reports} open report{e.open_reports > 1 ? 's' : ''}</span>
                            : <span className="whitespace-nowrap text-small text-muted">No open reports</span>}
                          <Button to={`/reports/new?equipment=${e.id}`} size="sm" variant="outline" className="whitespace-nowrap">Report a problem</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Pagination pagination={data.pagination} onPage={(p) => setQuery({ page: p })} />
                </>
              )}
        </section>
      </div>
    </div>
  );
}
