const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  organizer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizerName: { type: String, required: true },
  organizerPhone:{ type: String, required: true },
  venue:       { type: String, required: true, trim: true },
  state:       { type: String, trim: true, default: '' },
  district:    { type: String, trim: true, default: '' },
  date:        { type: Date, required: true },
  endDate:     { type: Date, default: null },
  bloodGroupsNeeded: [{ type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] }],
  targetDonors: { type: Number, default: 50 },
  attendees:   [{ userId: mongoose.Schema.Types.ObjectId, name: String, bloodGroup: String, joinedAt: { type: Date, default: Date.now } }],
  status:      { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
