/**
 * Country dial codes — sorted with India first, then alphabetically.
 * iso: 2-letter ISO 3166-1 alpha-2 code (used for flagcdn.com images)
 */
const COUNTRY_CODES = [
  { code: '+91',  iso: 'in', name: 'India',          maxDigits: 10 },
  { code: '+1',   iso: 'us', name: 'USA / Canada',   maxDigits: 10 },
  { code: '+44',  iso: 'gb', name: 'United Kingdom', maxDigits: 10 },
  { code: '+61',  iso: 'au', name: 'Australia',      maxDigits: 9  },
  { code: '+971', iso: 'ae', name: 'UAE',            maxDigits: 9  },
  { code: '+966', iso: 'sa', name: 'Saudi Arabia',   maxDigits: 9  },
  { code: '+65',  iso: 'sg', name: 'Singapore',      maxDigits: 8  },
  { code: '+60',  iso: 'my', name: 'Malaysia',       maxDigits: 10 },
  { code: '+94',  iso: 'lk', name: 'Sri Lanka',      maxDigits: 9  },
  { code: '+880', iso: 'bd', name: 'Bangladesh',     maxDigits: 10 },
  { code: '+977', iso: 'np', name: 'Nepal',          maxDigits: 10 },
  { code: '+92',  iso: 'pk', name: 'Pakistan',       maxDigits: 10 },
  { code: '+49',  iso: 'de', name: 'Germany',        maxDigits: 11 },
  { code: '+33',  iso: 'fr', name: 'France',         maxDigits: 9  },
  { code: '+39',  iso: 'it', name: 'Italy',          maxDigits: 10 },
  { code: '+34',  iso: 'es', name: 'Spain',          maxDigits: 9  },
  { code: '+81',  iso: 'jp', name: 'Japan',          maxDigits: 10 },
  { code: '+82',  iso: 'kr', name: 'South Korea',    maxDigits: 10 },
  { code: '+86',  iso: 'cn', name: 'China',          maxDigits: 11 },
  { code: '+55',  iso: 'br', name: 'Brazil',         maxDigits: 11 },
  { code: '+27',  iso: 'za', name: 'South Africa',   maxDigits: 9  },
  { code: '+234', iso: 'ng', name: 'Nigeria',        maxDigits: 10 },
  { code: '+254', iso: 'ke', name: 'Kenya',          maxDigits: 9  },
  { code: '+20',  iso: 'eg', name: 'Egypt',          maxDigits: 10 },
  { code: '+64',  iso: 'nz', name: 'New Zealand',    maxDigits: 9  },
];

export default COUNTRY_CODES;
