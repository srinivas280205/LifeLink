const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName:  { type: String, required: [true, 'Full name is required'], trim: true },
    phone: {
      type: String, required: true, unique: true,
      match: [/^\+?\d{7,15}$/, 'Phone number must be 7–15 digits'],
    },
    password:   { type: String, required: true, minlength: 6 },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: '',
    },
    isVerified:  { type: Boolean, default: false },
    country:     { type: String, trim: true, default: 'India' },
    state:       { type: String, trim: true, default: '' },
    district:    { type: String, trim: true, default: '' },
    isAvailable: { type: Boolean, default: true },
    isAdmin:     { type: Boolean, default: false },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
