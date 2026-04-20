const mongoose = require('mongoose');

const ALL_BLOOD_GROUPS = [
  // Common ABO/Rh
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  // Rare / Sub-types
  'A1+', 'A1-', 'A2+', 'A2-',
  'A1B+', 'A1B-', 'A2B+', 'A2B-',
  // Bombay / hh (extremely rare)
  'Bombay (hh)',
  // Other rare groups
  'Oh+', 'Oh-',
  '',
];

const userSchema = new mongoose.Schema(
  {
    fullName:  { type: String, required: [true, 'Full name is required'], trim: true },
    phone: {
      type: String, required: true, unique: true,
      match: [/^\+?\d{7,15}$/, 'Phone number must be 7–15 digits'],
    },
    password:   { type: String, required: true, minlength: 6 },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    bloodGroup: {
      type: String,
      enum: ALL_BLOOD_GROUPS,
      default: '',
    },
    isVerified:  { type: Boolean, default: false },
    isBanned:    { type: Boolean, default: false },
    banReason:   { type: String, default: '' },
    country:     { type: String, trim: true, default: 'India' },
    state:       { type: String, trim: true, default: '' },
    district:    { type: String, trim: true, default: '' },
    isAvailable: { type: Boolean, default: true },
    isAdmin:     { type: Boolean, default: false },
    donationCount: { type: Number, default: 0 },
    lastDonated:   { type: Date, default: null },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
