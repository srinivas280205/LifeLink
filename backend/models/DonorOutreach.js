const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Broadcast', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  state: { type: String, enum: ['notified', 'willing', 'declined', 'no_response', 'selected', 'withdrawn', 'completed'], default: 'notified' },
  deliveryState: { type: String, enum: ['pending', 'attempted', 'acknowledged', 'failed'], default: 'pending' },
  deliveryAttempts: { type: Number, default: 0, min: 0 },
  notifiedAt: Date,
  approximateDistanceKm: Number,
  locationSource: String,
  locationRecordedAt: Date,
  respondedAt: Date,
  selectedAt: Date,
  withdrawnAt: Date,
  completedAt: Date,
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
schema.index({ request: 1, donor: 1 }, { unique: true });
schema.index({ donor: 1, notifiedAt: 1 });
module.exports = mongoose.model('DonorOutreach', schema);
