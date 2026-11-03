import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconChevronRight, IconChevronDown, IconChevronLeft } from '../components/ui/Icons.jsx';

const FAQ = [
  ['How do I file a report?', ['Click the “File a report” button at the top of the page. You will be taken to a form.', 'Fill in the name of the equipment or facility, its category, campus, building and specific room, the type of damage, how urgent it is, a description, and (optionally) a photo.', 'Click “Submit report”. You can follow its progress under My Reports.']],
  ['What information do I need before reporting?', ['The name of the broken item (for example “HDMI port”), where it is (campus, building, room), what is wrong with it and, if possible, a clear photo (JPG or PNG, up to 2 MB).']],
  ['What if a location isn’t listed in the options?', ['Pick the closest building and room, then mention the exact place in the description. A Super Admin can add missing rooms or buildings to the reference data.']],
  ['What do the priorities mean?', ['Low: cosmetic or minor. Medium: affects use but has a workaround. High: blocks a class or activity. Urgent: safety risk or major leak/outage that needs attention right away.']],
  ['What do the statuses mean?', ['Pending: received, not started. In Progress: a technician is working on it. Solved: fixed (admin remarks explain what was done).']],
  ['Who do I contact if I need urgent assistance?', ['For emergencies (fire, flooding, injury) contact campus security or the physical plant office directly. Do not wait for an online report to be read.']],
];

export default function FAQs() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1 font-display font-semibold hover:text-accent"><IconChevronLeft /> Back</button>
      <h1 className="text-center text-display">FAQs</h1>
      <p className="mb-8 text-center font-display text-h3 text-secondary-300">Frequently Asked Questions</p>
      <ul className="border-t border-surface-line">
        {FAQ.map(([q, paragraphs], i) => {
          const isOpen = open === i;
          return (
            <li key={q} className="border-b border-primary/60">
              <h2 className="text-body">
                <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}
                        className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-h3 font-semibold uppercase">
                  {q}{isOpen ? <IconChevronDown className="h-6 w-6 shrink-0" /> : <IconChevronRight className="h-6 w-6 shrink-0" />}
                </button>
              </h2>
              {isOpen && <div id={`faq-${i}`} className="space-y-3 pb-6 text-neutral-200">{paragraphs.map((p) => <p key={p}>{p}</p>)}</div>}
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-center text-muted">Still stuck? <Link to="/reports/new" className="link">File a report</Link> and describe what you need.</p>
    </div>
  );
}
