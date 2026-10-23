import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await login(email, password); nav(loc.state?.from?.pathname || '/reports', { replace: true }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-split">
      <section className="auth-left">
        <Logo width={300} />
        <p className="auth-tag">YOUR DIGITAL EQUIPMENT TRACKING SYSTEM</p>
        <form onSubmit={submit} className="login-form" noValidate>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="pill" placeholder="123456789@usc.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" className="pill" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-green btn-login" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        </form>
        <p className="muted-center">No Account?<br /><Link to="/register" className="green-link">Sign Up</Link></p>
      </section>
      <section className="auth-right" aria-hidden="true" />
    </div>
  );
}
