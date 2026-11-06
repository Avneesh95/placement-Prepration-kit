const router = require('express').Router();
const { Notification } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../utils/errors');
const {
  generateContextualNotifications,
  getNotificationCounts,
  expireOldNotifications,
} = require('../services/notifications');

router.use(requireAuth);

// GET /api/notifications - List active notifications + accurate counters
router.get('/', asyncHandler(async (req, res) => {
  await generateContextualNotifications(req.user._id);
  await expireOldNotifications(req.user._id);

  const now = new Date();
  const filter = {
    user: req.user._id,
    status: { $in: ['unread', 'read'] },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  if (req.query.status) {
    const statuses = String(req.query.status).split(',').map((s) => s.trim().toLowerCase());
    filter.status = { $in: statuses };
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const counts = await getNotificationCounts(req.user._id);

  res.json({
    items: notifications.map((n) => ({
      _id: n._id,
      title: n.title || 'Notification',
      message: n.message || '',
      type: n.type || 'info',
      status: n.status || (n.read ? 'read' : 'unread'),
      link: n.link || null,
      read: n.status === 'unread' ? false : !!n.read,
      readAt: n.readAt || null,
      entityType: n.entityType || null,
      entityId: n.entityId || null,
      createdAt: n.createdAt,
    })),
    unreadCount: counts.unread,
    activeCount: counts.active,
    completedCount: counts.completed,
    totalCount: counts.total,
    counts,
  });
}));

// PATCH /api/notifications/:id/read - Mark specific notification as read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { status: 'read', read: true, readAt: new Date() } },
    { new: true }
  );

  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Notification not found or unauthorized.');
  }

  const counts = await getNotificationCounts(req.user._id);

  res.json({
    ok: true,
    item,
    unreadCount: counts.unread,
    activeCount: counts.active,
    counts,
  });
}));

// PATCH /api/notifications/read-all - Mark all unread as read
router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, status: 'unread' },
    { $set: { status: 'read', read: true, readAt: new Date() } }
  );

  const counts = await getNotificationCounts(req.user._id);

  res.json({
    ok: true,
    unreadCount: 0,
    activeCount: counts.active,
    counts,
  });
}));

// PATCH /api/notifications/:id/dismiss - Dismiss specific notification
router.patch('/:id/dismiss', asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { status: 'dismissed', read: true, dismissedAt: new Date() } },
    { new: true }
  );

  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Notification not found or unauthorized.');
  }

  const counts = await getNotificationCounts(req.user._id);

  res.json({
    ok: true,
    unreadCount: counts.unread,
    activeCount: counts.active,
    counts,
  });
}));

// PATCH /api/notifications/dismiss-all - Dismiss all active notifications
router.patch('/dismiss-all', asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, status: { $in: ['unread', 'read'] } },
    { $set: { status: 'dismissed', read: true, dismissedAt: new Date() } }
  );

  const counts = await getNotificationCounts(req.user._id);

  res.json({
    ok: true,
    unreadCount: 0,
    activeCount: 0,
    counts,
  });
}));

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) throw new ApiError(404, 'NOT_FOUND', 'Notification not found.');
  const counts = await getNotificationCounts(req.user._id);
  res.json({
    ok: true,
    unreadCount: counts.unread,
    activeCount: counts.active,
    counts,
  });
}));

// DELETE /api/notifications - Clear all notifications for user
router.delete('/', asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({
    ok: true,
    unreadCount: 0,
    activeCount: 0,
    counts: { unread: 0, active: 0, completed: 0, total: 0 },
  });
}));

module.exports = router;
