const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:        { type: String, enum: ['new_broadcast', 'donor_responded'], required: true },
  title:       { type: String, required: true },
  body:        { type: String, required: true },
  broadcastId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broadcast', default: null },
  read:        { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
