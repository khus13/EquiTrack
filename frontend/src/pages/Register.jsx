import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setErrors({}); setBusy(true);
    try { await register(f); nav('/reports', { replace: true }); }
    catch (err) { setErrors(err.errors || {}); setError(err.message); }
    finally { setBusy(false); }
  };
  const Err = ({ k }) => (errors[k] ? <span className="field-error">{errors[k]}</span> : null);

  return (
    <div className="register-page">
      <Link to="/login" className="register-logo"><Logo width={140} /></Link>
      <h1 className="reg-title">CREATE ACCOUNT</h1>
      <h2 className="reg-sub">LET’S GET STARTED.</h2>
      <form className="reg-form" onSubmit={submit} noValidate>
        <div className="reg-row">
          <div><label htmlFor="fn">FIRST NAME</label><input id="fn" className="pill" placeholder="Juan" value={f.first_name} onChange={set('first_name')} autoComplete="given-name" /><Err k="first_name" /></div>
          <div><label htmlFor="ln">LAST NAME</label><input id="ln" className="pill" placeholder="Dela Cruz" value={f.last_name} onChange={set('last_name')} autoComplete="family-name" /><Err k="last_name" /></div>
        </div>
        <label htmlFor="em">EMAIL</label>
        <input id="em" type="email" className="pill" placeholder="juandelacruz@gmail.com" value={f.email} onChange={set('email')} autoComplete="email" /><Err k="email" />
        <label htmlFor="pw">PASSWORD</label>
        <PasswordInput id="pw" className="pill" placeholder="••••••••" value={f.password} onChange={set('password')} autoComplete="new-password" /><Err k="password" />
        <label htmlFor="cpw">CONFIRM PASSWORD</label>
        <PasswordInput id="cpw" className="pill" placeholder="••••••••" value={f.confirm_password} onChange={set('confirm_password')} autoComplete="new-password" /><Err k="confirm_password" />
        {error && !Object.keys(errors).length && <p className="form-error" role="alert">{error}</p>}
        <div className="reg-actions">
          <button className="btn btn-green" disabled={busy}>{busy ? 'CREATING…' : 'CREATE ACCOUNT'}</button>
          <p className="already">Already have an account? <Link to="/login" className="blue-link">Sign in</Link></p>
        </div>
      </form>
    </div>
  );
}
