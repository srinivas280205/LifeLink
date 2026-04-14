const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterName:  { type: String, required: true },
    requesterPhone: { type: String, required: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    units:    { type: Number, default: 1, min: 1, max: 10 },
    state:    { type: String, trim: true, default: '' },
    district: { type: String, required: true, trim: true },
    hospital: { type: String, trim: true },
    message:  { type: String, trim: true, maxlength: 300 },
    urgency: {
      type: String,
      enum: ['critical', 'urgent', 'normal'],
      default: 'urgent',
    },
    isSOS:       { type: Boolean, default: false },
    escalated:   { type: Boolean, default: false },
    sosLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    sosRadius:   { type: Number, default: 50 }, // km
    status: {
      type: String,
      enum: ['active', 'fulfilled', 'cancelled'],
      default: 'active',
    },
    expiresAt: { type: Date, default: null }, // set by pre-save hook
    responses: [
      {
        donorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        donorName:   String,
        donorPhone:  String,
        bloodGroup:  String,
        respondedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-set expiresAt based on urgency on first save
const EXPIRY_HOURS = { critical: 6, urgent: 24, normal: 48 };
broadcastSchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    const hours = EXPIRY_HOURS[this.urgency] || 24;
    this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Broadcast', broadcastSchema);
