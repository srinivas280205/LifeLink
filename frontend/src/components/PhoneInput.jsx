import { useState, useRef, useEffect } from 'react';
import COUNTRY_CODES from '../data/countryCodes';
import styles from './PhoneInput.module.css';

/**
 * Flag using flag-icons CSS library — works on all browsers, no CDN needed.
 * Uses class "fi fi-{iso}" e.g. "fi fi-in" for India 🇮🇳
 */
function Flag({ iso, className = '' }) {
  return (
    <span
      className={`fi fi-${iso} ${styles.flagIcon} ${className}`}
      title={iso.toUpperCase()}
      aria-hidden="true"
    />
  );
}

/**
 * PhoneInput — country code picker + formatted number field.
 * Props:
 *   value    { countryCode: '+91', number: '93447 63919' }
 *   onChange (newValue) => void
 *   required bool
 */
export default function PhoneInput({ value, onChange, required = true }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const dropRef   = useRef(null);
  const searchRef = useRef(null);

  const selected = COUNTRY_CODES.find(c => c.code === value.countryCode)
    || COUNTRY_CODES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const formatDigits = (raw, max) => {
    const digits = raw.replace(/\D/g, '').slice(0, max);
    const half = Math.ceil(max / 2);
    if (digits.length <= half) return digits;
    return digits.slice(0, half) + ' ' + digits.slice(half);
  };

  const handleCountrySelect = (country) => {
    setOpen(false);
    setSearch('');
    const cleanDigits = value.number.replace(/\D/g, '');
    onChange({
      countryCode: country.code,
      number: formatDigits(cleanDigits, country.maxDigits),
    });
  };

  const handleNumberChange = (e) => {
    onChange({ ...value, number: formatDigits(e.target.value, selected.maxDigits) });
  };

  const filtered = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  );

  const maxChars    = selected.maxDigits + Math.floor(selected.maxDigits / 5);
  const half        = Math.ceil(selected.maxDigits / 2);
  const placeholder = `${'X'.repeat(half)} ${'X'.repeat(selected.maxDigits - half)}`;

  return (
    <div className={styles.wrap}>

      {/* ── Country code trigger ───────────────────────────── */}
      <div ref={dropRef} className={styles.codeTrigger}>
        <button
          type="button"
          className={`${styles.codeBtn} ${open ? styles.codeBtnOpen : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label="Select country code"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <Flag iso={selected.iso} />
          <span className={styles.code}>{selected.code}</span>
          <span className={`${styles.arrow} ${open ? styles.arrowUp : ''}`}>▾</span>
        </button>

        {/* ── Dropdown ─────────────────────────────────────── */}
        {open && (
          <div className={styles.dropdown} role="listbox">

            {/* Search */}
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                ref={searchRef}
                className={styles.searchInput}
                type="text"
                placeholder="Search country or +code…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <ul className={styles.list}>
              {filtered.length === 0 && (
                <li className={styles.noResult}>No country found</li>
              )}
              {filtered.map(country => (
                <li
                  key={country.code + country.iso}
                  className={`${styles.item} ${country.code === value.countryCode ? styles.itemActive : ''}`}
                  onClick={() => handleCountrySelect(country)}
                  role="option"
                  aria-selected={country.code === value.countryCode}
                >
                  <Flag iso={country.iso} />
                  <span className={styles.itemName}>{country.name}</span>
                  <span className={styles.itemCode}>{country.code}</span>
                  {country.code === value.countryCode && (
                    <span className={styles.checkMark}>✓</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Phone number input ────────────────────────────── */}
      <input
        className={styles.numberInput}
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={value.number}
        onChange={handleNumberChange}
        maxLength={maxChars}
        required={required}
        autoComplete="tel-national"
      />
    </div>
  );
}

/**
 * Combine country code + digits for API
 * { countryCode: '+91', number: '93447 63919' } → '+919344763919'
 */
export function toApiPhone({ countryCode, number }) {
  return countryCode + number.replace(/\s/g, '');
}
