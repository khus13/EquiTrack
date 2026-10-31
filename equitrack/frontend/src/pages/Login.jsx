import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/layout/Layouts.jsx';
import { TextInput, PasswordInput } from '../components/ui/Form.jsx';
import { Alert } from '../components/ui/Feedback.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateLogin } from '../lib/validators.js';
import { homePathFor } from '../lib/constants.js';
import { ApiError } from '../lib/api.js';

export default function Login() {
  const { user, ready, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  // already signed in? go to your home page
  if (ready && user) return <Navigate to={location.state?.from || homePathFor(user)} replace />;

  const set = (k) => (e) => { setValues((v) => ({ ...v, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const u = await login(values.email.trim(), values.password);
      toast.success(`Welcome back, ${u.first_name}!`);
      navigate(location.state?.from || homePathFor(u), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setErrors(err.errors);
      else setFormError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <AuthShell>
      <Link to="/" aria-label="EquiTrack home"><img src="/logo.png" alt="EquiTrack" className="h-32 w-auto sm:h-40" /></Link>
      <p className="mb-8 mt-4 text-center font-display text-h3 font-normal uppercase tracking-wide text-neutral-300">Your digital equipment tracking system</p>

      <form onSubmit={submit} noValidate className="w-full max-w-md space-y-5" aria-label="Log in">
        {formError && <Alert type="error">{formError}</Alert>}
        <TextInput label="Email" type="email" autoComplete="email" placeholder="123456789@usc.edu.ph" value={values.email} onChange={set('email')} error={errors.email} />
        <PasswordInput label="Password" autoComplete="current-password" placeholder="Your password" value={values.password} onChange={set('password')} error={errors.password} />
        <div className="pt-3 text-center"><Button type="submit" size="lg" loading={busy} className="min-w-[14rem]">Login</Button></div>
      </form>

      <p className="mt-8 text-center text-body text-neutral-300">No account? <Link to="/register" className="font-semibold text-primary underline underline-offset-4 hover:text-primary-light">Sign up</Link></p>
    </AuthShell>
  );
}
