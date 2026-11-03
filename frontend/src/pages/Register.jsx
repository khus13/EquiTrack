import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/layout/Layouts.jsx';
import { TextInput, PasswordInput } from '../components/ui/Form.jsx';
import { Alert } from '../components/ui/Feedback.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateRegister } from '../lib/validators.js';
import { homePathFor } from '../lib/constants.js';
import { ApiError } from '../lib/api.js';

export default function Register() {
  const { user, ready, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to={homePathFor(user)} replace />;

  const set = (k) => (e) => { setValues((v) => ({ ...v, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateRegister(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const u = await register({ ...values, email: values.email.trim(), first_name: values.first_name.trim(), last_name: values.last_name.trim() });
      toast.success('Account created. Welcome to EquiTrack!');
      navigate(homePathFor(u), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) { setErrors(err.errors); setFormError(err.message); }
      else setFormError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <AuthShell image={false}>
      <div className="w-full max-w-xl">
        <Link to="/" aria-label="EquiTrack home" className="mb-2 inline-block"><img src="/logo.png" alt="EquiTrack" className="h-16 w-auto" /></Link>
        <h1 className="text-center uppercase">Create account</h1>
        <p className="mb-8 mt-2 text-center font-display text-h3 font-semibold uppercase text-secondary-300">Let’s get started.</p>

        <form onSubmit={submit} noValidate className="space-y-4" aria-label="Create account">
          {formError && <Alert type="error">{formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="First name" autoComplete="given-name" placeholder="Juan" value={values.first_name} onChange={set('first_name')} error={errors.first_name} required />
            <TextInput label="Last name" autoComplete="family-name" placeholder="Dela Cruz" value={values.last_name} onChange={set('last_name')} error={errors.last_name} required />
          </div>
          <TextInput label="Email" type="email" autoComplete="email" placeholder="juandelacruz@usc.edu.ph" value={values.email} onChange={set('email')} error={errors.email} required />
          <PasswordInput label="Password" autoComplete="new-password" placeholder="At least 8 characters, letters and numbers" value={values.password} onChange={set('password')} error={errors.password} required />
          <PasswordInput label="Confirm password" autoComplete="new-password" placeholder="Type it again" value={values.confirm_password} onChange={set('confirm_password')} error={errors.confirm_password} required />
          <div className="pt-3 text-center"><Button type="submit" size="lg" loading={busy} className="min-w-[16rem] uppercase">Create account</Button></div>
        </form>
        <p className="mt-6 text-center text-neutral-300">Already have an account? <Link to="/login" className="link">Sign in</Link></p>
      </div>
    </AuthShell>
  );
}
