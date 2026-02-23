import { useEffect, useMemo, useRef, useState } from 'react';

export type ComboboxOption<T extends string | number> = {
  value: T;
  label: string;
  searchText?: string;
  disabled?: boolean;
};

type ComboboxProps<T extends string | number> = {
  options: ComboboxOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
};

export default function Combobox<T extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyText = 'No matches found',
  disabled = false,
  className,
}: ComboboxProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.searchText ?? ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return;
      const target = event.target as Node;
      if (!rootRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return;
    }
    setQuery('');
  }, [isOpen]);

  return (
    <div className={`combobox${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        type="button"
        className="combobox-toggle"
        onClick={() => setIsOpen((previous) => !previous)}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <span className={`combobox-toggle-label${selectedOption ? '' : ' placeholder'}`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className={`combobox-caret${isOpen ? ' open' : ''}`} aria-hidden>
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="combobox-panel" onKeyDown={(event) => event.key === 'Escape' && setIsOpen(false)}>
          <input
            ref={searchInputRef}
            className="form-input combobox-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
          />
          <div className="combobox-options">
            {filteredOptions.length === 0 && <div className="combobox-empty">{emptyText}</div>}
            {filteredOptions.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className={`combobox-option${option.value === value ? ' selected' : ''}`}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
