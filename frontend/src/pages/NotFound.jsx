import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { homePathFor } from '../lib/constants.js';

export function NotFound() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-[6rem] font-extrabold leading-none text-accent">404</p>
      <h1 className="mt-2 text-white">Page not found</h1>
      <p className="mb-8 mt-2 max-w-md text-muted">The page you are looking for does not exist or was moved.</p>
      <Button to={user ? homePathFor(user) : '/'}>Take me home</Button>
    </div>
  );
}

export function Unauthorized() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-[6rem] font-extrabold leading-none text-danger-light">403</p>
      <h1 className="mt-2 text-white">You don’t have access to this page</h1>
      <p className="mb-8 mt-2 max-w-md text-muted">Your account role does not allow this area. If you think this is a mistake, contact an administrator.</p>
      <div className="flex gap-3">
        <Button to={user ? homePathFor(user) : '/login'}>Go to my dashboard</Button>
        <Link to="/" className="btn btn-outline">Home</Link>
      </div>
    </div>
  );
}
