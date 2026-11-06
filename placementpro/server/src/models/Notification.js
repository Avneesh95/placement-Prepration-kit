const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'Notification' },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'info',
        'alert',
        'streak',
        'test',
        'drill',
        'recommendation',
        'achievement',
        'reminder',
        'announcement',
      ],
      default: 'info',
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'dismissed', 'completed', 'expired'],
      default: 'unread',
      index: true,
    },
    link: { type: String, default: null },
    entityType: { type: String, default: null, index: true },
    entityId: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    dismissedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, status: 1, createdAt: -1 });
notificationSchema.index({ user: 1, entityType: 1, entityId: 1 });

// Helper method to keep `read` boolean in sync before saving
notificationSchema.pre('save', function (next) {
  if (['read', 'completed', 'dismissed'].includes(this.status)) {
    this.read = true;
    if (!this.readAt && this.status === 'read') {
      this.readAt = new Date();
    }
  } else if (this.status === 'unread') {
    this.read = false;
    this.readAt = null;
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
