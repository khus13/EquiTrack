import { Link } from 'react-router-dom';

/** The eTrack logo (public/logo.png) linking home. */
export default function Logo({ className = 'h-10', to = '/' }) {
  return (
    <Link to={to} aria-label="EquiTrack home" className="inline-flex shrink-0 rounded-lg">
      <img src="/logo.png" alt="EquiTrack" className={`${className} w-auto`} />
    </Link>
  );
}
