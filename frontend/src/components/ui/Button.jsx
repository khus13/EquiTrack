import { Link } from 'react-router-dom';
import { Spinner } from './Feedback.jsx';

const VARIANTS = { primary: 'btn-primary', accent: 'btn-accent', outline: 'btn-outline', danger: 'btn-danger', ghost: 'btn-ghost' };
const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

/**
 * <Button variant="primary" loading={saving}>Save</Button>
 * Pass `to="/path"` to render a router link that looks like a button.
 */
export default function Button({ variant = 'primary', size = 'md', loading = false, to, className = '', children, disabled, type = 'button', ...rest }) {
  const cls = `btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
