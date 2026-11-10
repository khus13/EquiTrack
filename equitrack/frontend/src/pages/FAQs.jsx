import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronRight, IconChevronDown } from '../components/ui/Icons.jsx';

const FAQ = [
  ['How do I file a report?', ['Click the “File a report” button at the top of the page. You will be taken to a form.', 'Fill in the name of the equipment or facility, its category, campus, building and specific room, the type of damage, how urgent it is, a description, and (optionally) a photo.', 'Click “Submit report”. You can follow its progress under My Reports.']],
  ['What does ET mean in a report number?', ['ET stands for EquiTrack. For example, ET-2026-000012 is EquiTrack report 12 from 2026.']],
  ['What information do I need before reporting?', ['The name of the broken item (for example “HDMI port”), where it is (campus, building, room), what is wrong with it and, if possible, a clear photo (JPG or PNG, up to 2 MB).']],
  ['What if a location isn’t listed in the options?', ['Pick the closest building and room, then enter the exact place in Location details. A Super Admin can add missing rooms or buildings to the reference data.']],
  ['What do the priorities mean?', ['Low: cosmetic or minor. Medium: affects use but has a workaround. High: blocks a class or activity. Urgent: safety risk or major leak/outage that needs attention right away.']],
  ['What do the statuses mean?', ['Pending: received, not started. In Progress: a technician is working on it. Solved: fixed (admin remarks explain what was done).']],
  ['Who do I contact if I need urgent assistance?', ['For emergencies (fire, flooding, injury) contact campus security or the physical plant office directly. Do not wait for an online report to be read.']],
];

export default function FAQs() {
  const [open, setOpen] = useState(0);
  return (
    <div className="page">
      <header className="mb-8 text-center">
        <h1 className="normal-case text-display">FAQs</h1>
        <p className="mt-2 font-display text-h3 text-secondary-300">Frequently Asked Questions</p>
      </header>
      <ul className="mx-auto max-w-3xl space-y-3">
        {FAQ.map(([q, paragraphs], i) => {
          const isOpen = open === i;
          return (
            <li key={q} className="rounded-card border border-surface-line bg-surface-raised px-5">
              <h2 className="text-body">
                <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}
                        className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-h3 font-semibold">
                  {q}{isOpen ? <IconChevronDown className="h-6 w-6 shrink-0" /> : <IconChevronRight className="h-6 w-6 shrink-0" />}
                </button>
              </h2>
              <div id={`faq-${i}`} hidden={!isOpen} className="space-y-3 pb-6 text-neutral-200">
                {paragraphs.map((p) => <p key={p}>{p}</p>)}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mx-auto mt-8 max-w-3xl text-center text-muted">Still stuck? <Link to="/reports/new" className="link">File a report</Link> and describe what you need.</p>
    </div>
  );
}
