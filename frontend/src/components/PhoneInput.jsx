import { useState, useRef, useEffect } from 'react';
import COUNTRY_CODES from '../data/countryCodes';
import styles from './PhoneInput.module.css';

/**
 * PhoneInput — country code picker + formatted number field.
 *
 * Props:
 *   value        { countryCode: '+91', number: '93447 63919' }
 *   onChange     (newValue) => void
 *   placeholder  optional — defaults to country's digit hint
 *   required     bool
 */
export default function PhoneInput({ value, onChange, required = true }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef(null);

  const selected = COUNTRY_CODES.find(c => c.code === value.countryCode)
    || COUNTRY_CODES[0];

  // Close dropdown when clicking outside
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

  // Format phone digits as "XXXXX XXXXX" (split at half of maxDigits)
  const formatDigits = (raw, max) => {
    const digits = raw.replace(/\D/g, '').slice(0, max);
    const half = Math.ceil(max / 2);
    if (digits.length <= half) return digits;
    return digits.slice(0, half) + ' ' + digits.slice(half);
  };

  const handleCountrySelect = (country) => {
    setOpen(false);
    setSearch('');
    // Reformat existing number with new country's maxDigits
    const cleanDigits = value.number.replace(/\D/g, '');
    onChange({
      countryCode: country.code,
      number: formatDigits(cleanDigits, country.maxDigits),
    });
  };

  const handleNumberChange = (e) => {
    const formatted = formatDigits(e.target.value, selected.maxDigits);
    onChange({ ...value, number: formatted });
  };

  // Filter countries by search
  const filtered = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  );

  // Max chars = digits + spaces
  const maxChars = selected.maxDigits + Math.floor(selected.maxDigits / 5);

  return (
    <div className={styles.wrap}>
      {/* Country code trigger */}
      <div className={styles.codeTrigger} ref={dropRef}>
        <button
          type="button"
          className={styles.codeBtn}
          onClick={() => { setOpen(o => !o); setSearch(''); }}
          aria-label="Select country code"
          aria-expanded={open}
        >
          <span className={styles.flag}>{selected.flag}</span>
          <span className={styles.code}>{selected.code}</span>
          <span className={`${styles.arrow} ${open ? styles.arrowUp : ''}`}>▾</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className={styles.dropdown}>
            <div className={styles.searchWrap}>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <ul className={styles.list} role="listbox">
              {filtered.length === 0 && (
                <li className={styles.noResult}>No country found</li>
              )}
              {filtered.map(country => (
                <li
                  key={country.code + country.name}
                  className={`${styles.item} ${country.code === value.countryCode ? styles.itemActive : ''}`}
                  onClick={() => handleCountrySelect(country)}
                  role="option"
                  aria-selected={country.code === value.countryCode}
                >
                  <span className={styles.itemFlag}>{country.flag}</span>
                  <span className={styles.itemName}>{country.name}</span>
                  <span className={styles.itemCode}>{country.code}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Number input */}
      <input
        className={styles.numberInput}
        type="tel"
        inputMode="numeric"
        placeholder={`${'X'.repeat(Math.ceil(selected.maxDigits / 2))} ${'X'.repeat(Math.floor(selected.maxDigits / 2))}`}
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
 * Helper: convert PhoneInput value → plain phone string for API
 * e.g. { countryCode: '+91', number: '93447 63919' } → '+919344763919'
 */
export function toApiPhone({ countryCode, number }) {
  return countryCode + number.replace(/\s/g, '');
}
