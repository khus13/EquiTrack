import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordInput } from '../../components/ui/Form.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiError } from '../../lib/api.js';
import { validatePasswordChange } from '../../lib/validators.js';

const EMPTY_PW = { current_password: '', new_password: '', confirm_password: '' };

export default function AccountSecurity() {
  const { replaceUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [modal, setModal] = useState(null);            // 'password' | 'deactivate' | 'delete' | null
  const [pw, setPw] = useState(EMPTY_PW);
  const [confirmPw, setConfirmPw] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const close = () => { setModal(null); setPw(EMPTY_PW); setConfirmPw(''); setErrors({}); };

  const changePassword = async () => {
    const found = validatePasswordChange(pw);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try { await api.patch('/profile/password', pw); toast.success('Password changed.'); close(); }
    catch (e) { if (e instanceof ApiError && e.status === 422) setErrors(e.errors); else toast.error(e.message); }
    finally { setBusy(false); }
  };

  /** deactivate / delete both need the password and end the session */
  const dangerous = async (kind) => {
    if (!confirmPw) { setErrors({ password: 'Enter your password to confirm.' }); return; }
    setBusy(true);
    try {
      if (kind === 'delete') await api.del('/profile', { password: confirmPw });
      else await api.post('/profile/deactivate', { password: confirmPw });
      replaceUser(null);
      toast.info(kind === 'delete' ? 'Your account was deleted.' : 'Your account was deactivated.');
      navigate('/', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setErrors(e.errors); else { toast.error(e.message); close(); }
    } finally { setBusy(false); }
  };

  const Row = ({ title, text, button }) => (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-line py-5">
      <div><p className="text-h3 font-normal">{title}</p>{text && <p className="text-small text-muted">{text}</p>}</div>
      {button}
    </div>
  );

  return (
    <div>
      <p className="font-display text-h2 font-semibold text-secondary-300">Account</p>
      <hr className="mb-8 mt-3 border-surface-line" />
      <h1>Password &amp; security</h1>
      <div className="mt-6 max-w-3xl">
        <Row title="Password" text="Use at least 8 characters with letters and numbers." button={<Button onClick={() => setModal('password')}>Edit</Button>} />
        <Row title="Deactivate your account" text="Temporarily disable your account. An administrator can reactivate it." button={<Button variant="danger" onClick={() => setModal('deactivate')}>Deactivate</Button>} />
        <Row title="Delete your account" text="Close your account permanently. Your reports are deleted too." button={<Button variant="danger" onClick={() => setModal('delete')}>Delete</Button>} />
      </div>

      <Modal open={modal === 'password'} onClose={close} title="Change password"
        footer={<><Button variant="outline" onClick={close} disabled={busy}>Cancel</Button><Button onClick={changePassword} loading={busy}>Save password</Button></>}>
        <form onSubmit={(e) => { e.preventDefault(); changePassword(); }} noValidate className="space-y-4">
          <PasswordInput label="Current password" autoComplete="current-password" value={pw.current_password} error={errors.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
          <PasswordInput label="New password" autoComplete="new-password" value={pw.new_password} error={errors.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
          <PasswordInput label="Confirm new password" autoComplete="new-password" value={pw.confirm_password} error={errors.confirm_password} onChange={(e) => setPw({ ...pw, confirm_password: e.target.value })} />
        </form>
      </Modal>

      {['deactivate', 'delete'].map((kind) => (
        <Modal key={kind} open={modal === kind} onClose={close} title={kind === 'delete' ? 'Delete your account?' : 'Deactivate your account?'} size="sm"
          footer={<><Button variant="outline" onClick={close} disabled={busy}>Cancel</Button><Button variant="danger" onClick={() => dangerous(kind)} loading={busy}>{kind === 'delete' ? 'Delete forever' : 'Deactivate'}</Button></>}>
          <Alert type="warning" className="mb-4">{kind === 'delete' ? 'This cannot be undone. All your reports and photos will be removed.' : 'You will be signed out and will not be able to log in until an administrator reactivates you.'}</Alert>
          <form onSubmit={(e) => { e.preventDefault(); dangerous(kind); }} noValidate>
            <PasswordInput label="Confirm with your password" autoComplete="current-password" value={confirmPw} error={errors.password} onChange={(e) => { setConfirmPw(e.target.value); setErrors({}); }} />
          </form>
        </Modal>
      ))}
    </div>
  );
}
