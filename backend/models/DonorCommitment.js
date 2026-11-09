const mongoose = require('mongoose');
// Active commitments only. Release explicitly; do not rely on delayed TTL deletion.
const schema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Broadcast', required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
module.exports = mongoose.model('DonorCommitment', schema);
