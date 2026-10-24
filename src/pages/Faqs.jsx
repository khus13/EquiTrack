const FAQS = [
  ['How do I report a broken item?', 'Click “FILE A REPORT”, fill in the item name, category, description and location, upload a photo, then submit.'],
  ['Why do I need to upload a photo?', 'A photo helps maintenance verify the issue and prevents spam or false reports. Accepted formats are JPG, PNG and WebP up to 5MB.'],
  ['What do the statuses mean?', 'Unresolved: received but not yet addressed. Work In Progress: maintenance is handling it. Resolved: the issue has been fixed.'],
  ['Can I check on an existing report?', 'Yes. Search by status or location in the top bar, use the filters, or open your account menu and choose “My reports”.'],
  ['Who updates the status?', 'Only administrators can change a report’s status.'],
];

export default function Faqs() {
  return (
    <div className="panel">
      <div className="panel-inner">
        <h1 className="panel-title">FAQs</h1>
        {FAQS.map(([q, a]) => (
          <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>
        ))}
      </div>
    </div>
  );
}
