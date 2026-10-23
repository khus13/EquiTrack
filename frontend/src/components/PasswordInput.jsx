import { useState } from 'react';

export default function PasswordInput({ className = '', ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input {...props} type={show ? 'text' : 'password'} className={className} />
      <button type="button" className="pw-eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? (
          <svg width="30" height="24" viewBox="0 0 30 24" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round"><path d="M2 12C6 5 24 5 28 12C24 19 6 19 2 12Z" /><circle cx="15" cy="12" r="3.5" /></svg>
        ) : (
          <svg width="36" height="24" viewBox="0 0 36 24" fill="none" stroke="#111" strokeWidth="1.6" strokeLinecap="round"><path d="M3 10c8 8 22 8 30 0" /><path d="M8 15l-3 4M15 17l-1 4M22 17l1 4M29 15l3 4" /></svg>
        )}
      </button>
    </div>
  );
}
