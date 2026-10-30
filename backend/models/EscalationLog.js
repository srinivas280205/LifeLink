const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Broadcast', required: true },
  decisionId: { type: String, required: true },
  radiusKm: { type: Number, required: true, min: 0 },
  alertedCount: { type: Number, default: 0, min: 0 },
  reason: { type: String, required: true },
}, { timestamps: true });
schema.index({ request: 1, decisionId: 1 }, { unique: true });
module.exports = mongoose.model('EscalationLog', schema);
