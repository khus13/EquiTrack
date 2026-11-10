import { useEffect, useId, useRef, useState } from 'react';
import { IconChevronDown } from './Icons.jsx';

export default function SelectControl({ value = '', options = [], placeholder = 'Select an option', onChange, className = '', containerClassName = '', ...a11y }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = useId();
  const menuOptions = [{ value: '', label: placeholder }, ...options];
  const selectedIndex = menuOptions.findIndex((option) => String(option.value) === String(value));
  const selected = selectedIndex >= 0 ? menuOptions[selectedIndex] : null;

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  const choose = (option) => {
    onChange?.({ target: { value: String(option.value) } });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
      } else {
        setActiveIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + menuOptions.length) % menuOptions.length);
      }
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(menuOptions.length - 1);
    } else if ((event.key === 'Enter' || event.key === ' ') && open && activeIndex >= 0) {
      event.preventDefault();
      choose(menuOptions[activeIndex]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${containerClassName || 'w-full'}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`input flex w-full items-center justify-between gap-3 text-left ${open ? 'border-accent' : ''} ${className}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        onClick={() => {
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setOpen((isOpen) => !isOpen);
        }}
        onKeyDown={handleKeyDown}
        {...a11y}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? '' : 'text-neutral-500'}`}>
          {selected?.label || placeholder}
        </span>
        <IconChevronDown className={`h-5 w-5 shrink-0 text-neutral-700 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button> 
      {open && (
        <div
          id={listId}
          role="listbox"
          className="select-menu-scrollbar absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-surface-line bg-cream p-1.5 text-ink shadow-card"
        >
          {menuOptions.map((option, index) => {
            const isSelected = index === selectedIndex;
            const isActive = index === activeIndex;
            return (
              <div
                key={option.value}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                className={`cursor-pointer rounded-xl px-4 py-2.5 text-body transition ${
                  isActive ? 'bg-black/10' : 'hover:bg-black/5'
                } ${isSelected ? 'font-semibold' : ''}`}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
