import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

export default function CustomSelect({
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  const selectedLabel = options.find(o => o.value === value)?.label || '';

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const toggle = () => {
    if (!disabled) {
      setOpen(!open);
      setSearch('');
    }
  };

  const select = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
    setSearch('');
  };

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const showSearch = options.length > 6;

  return (
    <div className={`cs-root ${disabled ? 'cs-disabled' : ''}`} ref={ref}>
      {/* Hidden native input for form validation */}
      {required && <input type="text" value={value || ''} required tabIndex={-1} className="cs-hidden-input" onChange={() => {}} />}

      <button type="button" className={`cs-trigger ${open ? 'cs-open' : ''}`} onClick={toggle}>
        <span className={`cs-value ${!value ? 'cs-placeholder' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="cs-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="cs-dropdown">
          {showSearch && (
            <div className="cs-search-wrap">
              <input
                ref={searchRef}
                type="text"
                className="cs-search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <div className="cs-list">
            {/* Empty option */}
            <div
              className={`cs-option ${!value ? 'cs-selected' : ''}`}
              onClick={() => select('')}
            >
              {placeholder}
            </div>
            {filtered.length === 0 ? (
              <div className="cs-empty">No results</div>
            ) : (
              filtered.map(o => (
                <div
                  key={o.value}
                  className={`cs-option ${o.value === value ? 'cs-selected' : ''}`}
                  onClick={() => select(o.value)}
                >
                  {o.label}
                  {o.value === value && <span className="cs-check">✓</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
