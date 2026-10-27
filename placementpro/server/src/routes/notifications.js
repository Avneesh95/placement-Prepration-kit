const router = require('express').Router();
const { Notification, MockTest, TestAttempt, UserProgress } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../utils/errors');

router.use(requireAuth);

// Helper to seed initial sensible notifications if user has none
async function ensureDefaultNotifications(userId) {
  const count = await Notification.countDocuments({ user: userId });
  if (count === 0) {
    const welcomeNotifications = [
      {
        user: userId,
        title: '24 Timed Mock Tests Ready',
        message: 'Full-length and sectional pattern tests for TCS, Infosys, Cognizant and more are now active.',
        type: 'test',
        link: '/mocks',
        read: false,
      },
      {
        user: userId,
        title: 'Daily Coding & SQL Labs',
        message: 'Practice verified problems linked directly with official LeetCode problems.',
        type: 'drill',
        link: '/coding',
        read: false,
      },
      {
        user: userId,
        title: 'Placement 2027 Syllabus Explorer',
        message: 'Explore company-wise section syllabi, question counts, and start topic drills.',
        type: 'recommendation',
        link: '/drill',
        read: false,
      },
    ];
    await Notification.insertMany(welcomeNotifications);
  }
}

// GET /api/notifications - List user's notifications + unread count
router.get('/', asyncHandler(async (req, res) => {
  await ensureDefaultNotifications(req.user._id);

  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });

  res.json({
    items: notifications.map((n) => ({
      _id: n._id,
      title: n.title || 'Notification',
      message: n.message || '',
      type: n.type || 'info',
      link: n.link || null,
      read: !!n.read,
      createdAt: n.createdAt,
    })),
    unreadCount,
  });
}));

// PATCH /api/notifications/:id/read - Mark specific notification as read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );

  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Notification not found or unauthorized.');
  }

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });

  res.json({ ok: true, item, unreadCount });
}));

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  res.json({ ok: true, unreadCount: 0 });
}));

module.exports = router;
