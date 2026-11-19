import { useState } from 'react';
import { TextInput } from '../../components/ui/Form.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiError } from '../../lib/api.js';
import { validateProfile } from '../../lib/validators.js';

export default function AccountProfile() {
  const { user, replaceUser } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ first_name: user.first_name, last_name: user.last_name, email: user.email });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => { setValues((v) => ({ ...v, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };
  const dirty = ['first_name', 'last_name', 'email'].some((k) => values[k] !== user[k]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateProfile(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const data = await api.patch('/profile', values);
      replaceUser(data.user);
      toast.success('Profile updated.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setErrors(err.errors); else setFormError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <p className="font-display text-h2 font-semibold text-secondary-300">Account</p>
      <hr className="mb-8 mt-3 border-surface-line" />
      <h1>Profile info</h1>
      <p className="mb-8 mt-1 text-body text-neutral-200">Update your display name and e-mail address.</p>
      <form onSubmit={submit} noValidate className="max-w-2xl space-y-5" aria-label="Profile">
        {formError && <Alert type="error">{formError}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="First name" value={values.first_name} onChange={set('first_name')} error={errors.first_name} autoComplete="given-name" />
          <TextInput label="Last name" value={values.last_name} onChange={set('last_name')} error={errors.last_name} autoComplete="family-name" />
        </div>
        <TextInput label="Email address" type="email" value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <Button type="submit" loading={busy} disabled={!dirty}>Save changes</Button>
      </form>
    </div>
  );
}
