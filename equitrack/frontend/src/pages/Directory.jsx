import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useListQuery, useSearchBox } from '../hooks/useListQuery.js';
import { api, equipmentImageUrl } from '../lib/api.js';
import { useMeta } from '../context/MetaContext.jsx';
import { EQUIPMENT_STATUS_LABEL } from '../lib/constants.js';
import { Breadcrumbs, Pagination } from '../components/ui/Data.jsx';
import { EquipmentStatusBadge } from '../components/ui/Badges.jsx';
import { EmptyState, ErrorState, CardSkeleton } from '../components/ui/Feedback.jsx';
import Button from '../components/ui/Button.jsx';
import { IconSearch, IconPin, IconBox, IconChevronRight } from '../components/ui/Icons.jsx';

const DIRECTORY_PAGE_SIZE = 12;

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

  const { data, loading, error, reload } = useApi(() => api.get('/equipment', { ...query, per_page: DIRECTORY_PAGE_SIZE }), [JSON.stringify(query)]);

  useEffect(() => {
    const refresh = () => reload();
    const onMessage = (event) => {
      if (event.data?.type === 'report-submitted') refresh();
    };
    window.addEventListener('equitrack:report-submitted', refresh);
    window.addEventListener('focus', refresh);
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('equitrack-updates') : null;
    if (channel) channel.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('equitrack:report-submitted', refresh);
      window.removeEventListener('focus', refresh);
      channel?.removeEventListener('message', onMessage);
      channel?.close();
    };
  }, [reload]);

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
            <legend className="mb-2 font-display text-h3 text-secondary-300">Status</legend>
            <select aria-label="Equipment status" value={query.status} onChange={(e) => setQuery({ status: e.target.value })} className="input py-2.5">
              <option value="">All statuses</option>
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
                    {data.items.map((e) => {
                      const card = (
                        <div className={`flex h-full flex-col overflow-hidden rounded-card bg-surface-raised transition ${e.latest_report_id ? 'group-hover:bg-white/5 group-hover:ring-2 group-hover:ring-accent/60' : ''}`}>
                          <div className="h-40 w-full bg-surface-sunken">
                            {e.image_id && <img src={equipmentImageUrl(e.id)} alt={`Report photo for ${e.name}`} loading="lazy"
                              onError={(event) => { event.currentTarget.hidden = true; }} className="h-full w-full object-cover" />}
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="break-words font-display">{e.name}</h3>
                              {e.latest_report_id && <IconChevronRight className="mt-1 h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-1" />}
                            </div>
                            <p className="text-tiny text-muted">{e.asset_tag} · {e.type_name || e.category_name}</p>
                            <p className="mt-2 flex items-start gap-1.5 text-small text-neutral-200"><IconPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />{e.room_name}, {e.building_name} · {e.campus_name}</p>
                            <div className="mt-auto pt-4"><EquipmentStatusBadge status={e.status} /></div>
                          </div>
                        </div>
                      );
                      return (
                        <li key={e.id} className="h-full">
                          {e.latest_report_id
                            ? <Link to={`/reports/${e.latest_report_id}`} aria-label={`View latest report for ${e.name}`}
                                className="group block h-full rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{card}</Link>
                            : card}
                        </li>
                      );
                    })}
                  </ul>
                  <Pagination pagination={data.pagination} onPage={(p) => setQuery({ page: p })} />
                </>
              )}
        </section>
      </div>
    </div>
  );
}
