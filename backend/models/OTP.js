const mongoose = require('mongoose');

/**
 * OTP document auto-deleted by MongoDB after expiresAt (TTL index).
 * Each phone can have only one active OTP — upsert on send replaces it.
 */
const OTPSchema = new mongoose.Schema({
  phone:     { type: String, required: true, unique: true },
  otp:       { type: String, required: true },
  attempts:  { type: Number, default: 0 },   // wrong-attempt counter
  expiresAt: { type: Date,   required: true },
});

// MongoDB TTL index: auto-deletes document when expiresAt passes
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', OTPSchema);
