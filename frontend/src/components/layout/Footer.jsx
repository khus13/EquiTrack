import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-surface-line bg-surface-nav">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-small text-muted sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} EquiTrack · University of San Carlos – Talamban Campus</p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link to="/faqs" className="hover:text-white hover:underline">FAQs</Link>
          <Link to="/directory" className="hover:text-white hover:underline">Directory</Link>
        </nav>
      </div>
    </footer>
  );
}
