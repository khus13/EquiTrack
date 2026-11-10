import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { homePathFor } from '../../lib/constants.js';

/** The eTrack logo (public/logo.png) linking home. */
export default function Logo({ className = 'h-10', to }) {
  const { user } = useAuth();
  return (
    <Link to={to || (user ? homePathFor(user) : '/')} aria-label="EquiTrack home" className="inline-flex shrink-0 rounded-lg">
      <img src="/logo.png" alt="EquiTrack" className={`${className} w-auto`} />
    </Link>
  );
}
