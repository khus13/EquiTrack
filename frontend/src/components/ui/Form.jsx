import { useId, useRef, useState } from 'react';
import { IconAlert, IconEye, IconEyeOff, IconImage, IconClose } from './Icons.jsx';
import { imageProblem } from '../../lib/validators.js';

/**
 * Field = label + control + inline error + hint.
 * It passes the generated id / aria attributes to its child render function so that:
 *   - the <label> is linked to the input (screen readers)
 *   - the error is announced (aria-describedby / aria-invalid)
 */
export function Field({ label, error, hint, required, children, className = '' }) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errId, hint && hintId].filter(Boolean).join(' ') || undefined;
  const control = typeof children === 'function'
    ? children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, 'aria-required': required || undefined })
    : children;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}{required && <span className="ml-1 text-danger-light" aria-hidden="true">*</span>}
        </label>
      )}
      {control}
      {hint && !error && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errId} className="field-error" role="alert"><IconAlert className="h-4 w-4 shrink-0" />{error}</p>}
    </div>
  );
}

const cls = (error, extra = '') => `input ${error ? 'input-error' : ''} ${extra}`;

export function TextInput({ label, error, hint, required, className = '', ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => <input className={cls(error)} {...a11y} {...rest} />}
    </Field>
  );
}

export function PasswordInput({ label, error, hint, required, className = '', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => (
        <div className="relative">
          <input className={cls(error, 'pr-14')} type={show ? 'text' : 'password'} {...a11y} {...rest} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-neutral-700 hover:bg-black/10">
            {show ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      )}
    </Field>
  );
}

/** options: [{value, label}]  */
export function Select({ label, error, hint, required, options = [], placeholder, className = '', ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => (
        <select className={cls(error)} {...a11y} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

export function Textarea({ label, error, hint, required, className = '', rows = 5, ...rest }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(a11y) => <textarea rows={rows} className={cls(error)} {...a11y} {...rest} />}
    </Field>
  );
}

/**
 * FileUpload: choose or drag-drop ONE image (jpg/png, max 2 MB) with a live preview.
 * `onChange(file | null)`; validation message is shown inline.
 */
export function FileUpload({ label = 'Upload photo', hint = 'JPG or PNG, max 2 MB. Optional.', file, onChange, error }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [preview, setPreview] = useState(null);
  const id = useId();

  const choose = (f) => {
    if (!f) return;
    const problem = imageProblem(f);
    setLocalError(problem);
    if (problem) { onChange(null); setPreview(null); return; }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    onChange(f);
  };
  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setLocalError(null); onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const shownError = localError || error;

  return (
    <div>
      <span className="label" id={`${id}-label`}>{label}</span>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files[0]); }}
        className={`rounded-3xl border-2 border-dashed p-4 transition ${drag ? 'border-accent bg-accent/10' : shownError ? 'border-danger-light' : 'border-surface-line bg-surface-sunken'}`}
      >
        {file && preview ? (
          <div className="flex items-center gap-4">
            <img src={preview} alt="Selected photo preview" className="h-20 w-20 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-medium text-white">{file.name}</p>
              <p className="text-tiny text-muted">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={clear} className="btn btn-outline btn-sm" aria-label="Remove selected photo"><IconClose className="h-4 w-4" /> Remove</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <IconImage className="h-8 w-8 text-muted" />
            <p className="text-small text-neutral-200">Drag a photo here or</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-primary btn-sm" aria-describedby={`${id}-hint`}>Choose file</button>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="sr-only" tabIndex={-1} aria-labelledby={`${id}-label`}
               onChange={(e) => choose(e.target.files[0])} />
      </div>
      {!shownError && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {shownError && <p className="field-error" role="alert"><IconAlert className="h-4 w-4 shrink-0" />{shownError}</p>}
    </div>
  );
}
