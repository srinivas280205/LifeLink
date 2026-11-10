function normalizePhone(value) {
 if (typeof value !== 'string') return '';
 const trimmed = value.trim();
 if (!/^\+?[0-9\s().-]+$/.test(trimmed)) return '';
 let digits = trimmed.replace(/\D/g, '');
 if (digits.startsWith('00')) digits = digits.slice(2);
 if (digits.length === 10) digits = '91' + digits;
 return /^[1-9][0-9]{7,14}$/.test(digits) ? '+' + digits : '';
}
function phoneCandidates(value) {
 const normalized = normalizePhone(value);
 const values = [value.trim()];
 if (normalized) {
  values.push(normalized, normalized.slice(1));
  if (/^\+91\d{10}$/.test(normalized)) values.push(normalized.slice(3));
 }
 return [...new Set(values)];
}
module.exports = {normalizePhone, phoneCandidates};
