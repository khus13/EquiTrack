import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './Icons.jsx';
import Button from './Button.jsx';

/**
 * Accessible modal dialog: Esc closes, Tab stays inside, focus returns to the opener,
 * background scroll is locked.
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    const focusables = () => ref.current?.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') || [];
    // focus the first field (or the dialog itself)
    const first = focusables()[1] || focusables()[0];
    (first || ref.current)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {                       // keep focus inside the dialog
        const list = Array.from(focusables());
        if (!list.length) return;
        const a = list[0]; const z = list[list.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
           className={`flex max-h-[92vh] w-full ${width} flex-col rounded-t-3xl bg-surface-raised shadow-card sm:rounded-3xl`}>
        <div className="flex items-center justify-between gap-4 border-b border-surface-line px-6 py-4">
          <h2 className="text-h3">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-white/10 hover:text-white" aria-label="Close dialog"><IconClose /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-surface-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** "Are you sure?" dialog for dangerous actions. */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onClose, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>}>
      {message && <p className="text-neutral-200">{message}</p>}
      {children}
    </Modal>
  );
}
