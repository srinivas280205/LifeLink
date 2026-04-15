/**
 * Country dial codes — sorted with India first, then alphabetically.
 */
const COUNTRY_CODES = [
  { code: '+91',  name: 'India',               flag: '🇮🇳', maxDigits: 10 },
  { code: '+1',   name: 'USA / Canada',         flag: '🇺🇸', maxDigits: 10 },
  { code: '+44',  name: 'United Kingdom',       flag: '🇬🇧', maxDigits: 10 },
  { code: '+61',  name: 'Australia',            flag: '🇦🇺', maxDigits: 9  },
  { code: '+971', name: 'UAE',                  flag: '🇦🇪', maxDigits: 9  },
  { code: '+966', name: 'Saudi Arabia',         flag: '🇸🇦', maxDigits: 9  },
  { code: '+65',  name: 'Singapore',            flag: '🇸🇬', maxDigits: 8  },
  { code: '+60',  name: 'Malaysia',             flag: '🇲🇾', maxDigits: 10 },
  { code: '+94',  name: 'Sri Lanka',            flag: '🇱🇰', maxDigits: 9  },
  { code: '+880', name: 'Bangladesh',           flag: '🇧🇩', maxDigits: 10 },
  { code: '+977', name: 'Nepal',                flag: '🇳🇵', maxDigits: 10 },
  { code: '+92',  name: 'Pakistan',             flag: '🇵🇰', maxDigits: 10 },
  { code: '+49',  name: 'Germany',              flag: '🇩🇪', maxDigits: 11 },
  { code: '+33',  name: 'France',               flag: '🇫🇷', maxDigits: 9  },
  { code: '+39',  name: 'Italy',                flag: '🇮🇹', maxDigits: 10 },
  { code: '+34',  name: 'Spain',                flag: '🇪🇸', maxDigits: 9  },
  { code: '+81',  name: 'Japan',                flag: '🇯🇵', maxDigits: 10 },
  { code: '+82',  name: 'South Korea',          flag: '🇰🇷', maxDigits: 10 },
  { code: '+86',  name: 'China',                flag: '🇨🇳', maxDigits: 11 },
  { code: '+55',  name: 'Brazil',               flag: '🇧🇷', maxDigits: 11 },
  { code: '+27',  name: 'South Africa',         flag: '🇿🇦', maxDigits: 9  },
  { code: '+234', name: 'Nigeria',              flag: '🇳🇬', maxDigits: 10 },
  { code: '+254', name: 'Kenya',                flag: '🇰🇪', maxDigits: 9  },
  { code: '+20',  name: 'Egypt',                flag: '🇪🇬', maxDigits: 10 },
  { code: '+64',  name: 'New Zealand',          flag: '🇳🇿', maxDigits: 9  },
];

export default COUNTRY_CODES;
