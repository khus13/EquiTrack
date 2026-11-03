import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { homePathFor } from '../lib/constants.js';
import { num } from '../lib/format.js';
import Button from '../components/ui/Button.jsx';
import { IconClipboard, IconSearch, IconCheck, IconWrench } from '../components/ui/Icons.jsx';

const STEPS = [
  { icon: IconClipboard, title: 'Report it', text: 'Fill in a short form: what is broken, where it is, how urgent, and add a photo.' },
  { icon: IconWrench, title: 'We repair it', text: 'Campus maintenance sees every report, sorted by priority, and starts working on it.' },
  { icon: IconCheck, title: 'Track it', text: 'Follow your report from Pending to In Progress to Solved on your own timeline.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { data } = useApi(() => api.get('/stats/public'), []);   // public numbers (works logged out)

  return (
    <>
      {/* hero */}
      <section className="bg-black">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-3 font-display text-small font-semibold uppercase tracking-widest text-secondary-300">University of San Carlos · Talamban</p>
            <h1 className="text-display">Your digital <span className="text-white">equipment</span> tracking system.</h1>
            <p className="mt-5 max-w-lg text-h3 font-normal text-neutral-300">Spotted something broken on campus? Report it in a minute and watch it get fixed.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              {user ? (
                <>
                  <Button to="/reports/new" size="lg">File a report</Button>
                  <Button to={homePathFor(user)} variant="outline" size="lg">Go to dashboard</Button>
                </>
              ) : (
                <>
                  <Button to="/register" size="lg">Get started</Button>
                  <Button to="/login" variant="outline" size="lg">Log in</Button>
                </>
              )}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem]">
            <img src="https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&w=1000&q=70" alt="" loading="lazy"
                 className="aspect-[4/3] w-full bg-surface-raised object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/50 to-transparent" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* public numbers */}
      <section aria-label="Campus numbers" className="border-y border-surface-line bg-surface-sunken">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center sm:px-6 md:grid-cols-4">
          {[
            ['Reports filed', data?.reports_total],
            ['Issues solved', data?.reports_solved],
            ['Equipment listed', data?.equipment_total],
            ['Buildings covered', data?.buildings_total],
          ].map(([label, value]) => (
            <div key={label}>
              <dd className="font-display text-[2.25rem] font-bold text-accent">{value === undefined ? '—' : num(value)}</dd>
              <dt className="text-small text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* how it works */}
      <section className="page py-16">
        <h2 className="mb-8 text-center">How it works</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent"><s.icon className="h-6 w-6" /></div>
              <h3><span className="text-muted">{i + 1}.</span> {s.title}</h3>
              <p className="mt-2 text-neutral-300">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-black">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6">
          <IconSearch className="h-8 w-8 text-accent" />
          <h2>Looking for a specific item?</h2>
          <p className="max-w-xl text-muted">Browse the equipment directory by campus, building, category and type to see what is working and what needs repair.</p>
          <Button to={user ? '/directory' : '/login'} variant="accent">Open the directory</Button>
        </div>
      </section>
    </>
  );
}
