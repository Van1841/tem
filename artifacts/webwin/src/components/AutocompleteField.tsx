import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { MapPin, Search, Tag } from 'lucide-react';
import {
  getGetPlaceSuggestionsQueryKey,
  useGetPlaceSuggestions,
  type GetPlaceSuggestionsKind,
} from '@workspace/api-client-react';

type Props = {
  kind: GetPlaceSuggestionsKind;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

// Yeh field suggestions deta hai, lekin free typing ko bhi support karta hai.
export function AutocompleteField({ kind, label, placeholder, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const query = value.trim();
  const params = useMemo(() => ({ kind, query: query.length >= 2 ? query : 'a' }), [kind, query]);
  const suggestions = useGetPlaceSuggestions(params, {
    query: {
      enabled: open && query.length >= 2,
      queryKey: getGetPlaceSuggestionsQueryKey(params),
      staleTime: 30_000,
    },
  });
  const options = suggestions.data?.items ?? [];
  const Icon = kind === 'location' ? MapPin : Tag;
  const listId = `suggestions-${kind}`;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // Keyboard se dropdown chalta hai aur input ka typed value kabhi block nahi hota.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && options.length) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % options.length);
    } else if (event.key === 'ArrowUp' && options.length) {
      event.preventDefault();
      setActive((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === 'Enter' && open && active >= 0 && options[active]) {
      event.preventDefault();
      onChange(options[active].value);
      setOpen(false);
      setActive(-1);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="autocomplete-root" ref={rootRef}>
      <label className="field-label" htmlFor={`input-${kind}`}>{label}</label>
      <div className="field-shell input-wrap">
        <Icon size={18} aria-hidden="true" />
        <input
          id={`input-${kind}`}
          data-testid={`input-${kind}`}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
        />
        {kind === 'location' && <Search className="input-end-icon" size={16} aria-hidden="true" />}
      </div>
      {open && query.length >= 2 && (
        <div className="suggestion-popover" id={listId} role="listbox" aria-label={`${label} suggestions`}>
          {suggestions.isLoading ? (
            <div className="suggestion-hint"><span className="mini-spinner" /> Looking for suggestions…</div>
          ) : suggestions.isError ? (
            <div className="suggestion-hint">Suggestions unavailable. You can still use what you typed.</div>
          ) : options.length ? (
            options.map((item, index) => (
              <button
                type="button"
                role="option"
                aria-selected={active === index}
                id={`${listId}-${index}`}
                className="suggestion-option"
                key={`${item.value}-${index}`}
                data-testid={`suggestion-${kind}-${index}`}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                  setActive(-1);
                }}
              >
                <span className="suggestion-icon"><Icon size={15} /></span>
                <span>{item.label}</span>
              </button>
            ))
          ) : (
            <div className="suggestion-hint">No matches yet. Your typed search still works.</div>
          )}
        </div>
      )}
    </div>
  );
}