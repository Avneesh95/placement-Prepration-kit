const { Notification, User, UserProgress, TestAttempt } = require('../models');

/**
 * Creates a notification with deduplication.
 * If an active notification with identical entityType and entityId already exists for this user,
 * duplicate creation is prevented.
 */
async function createNotification(userId, data) {
  if (!userId || !data) return null;

  if (data.entityType && data.entityId) {
    const existing = await Notification.findOne({
      user: userId,
      entityType: data.entityType,
      entityId: data.entityId,
      status: { $in: ['unread', 'read'] },
    });
    if (existing) {
      return existing; // Prevent duplicate active notification
    }
  }

  const notification = await Notification.create({
    user: userId,
    title: data.title || 'Notification',
    message: data.message || '',
    type: data.type || 'info',
    status: 'unread',
    read: false,
    link: data.link || null,
    entityType: data.entityType || null,
    entityId: data.entityId || null,
    expiresAt: data.expiresAt || null,
    metadata: data.metadata || null,
  });

  return notification;
}

/**
 * Marks notifications matching entityType & entityId as COMPLETED.
 */
async function resolveNotification(userId, entityType, entityId) {
  if (!userId || !entityType) return;
  const query = {
    user: userId,
    entityType,
    status: { $in: ['unread', 'read'] },
  };
  if (entityId) {
    query.entityId = String(entityId);
  }

  await Notification.updateMany(query, {
    $set: {
      status: 'completed',
      read: true,
      completedAt: new Date(),
    },
  });
}

/**
 * Expires active notifications that have passed their expiration timestamp.
 */
async function expireOldNotifications(userId) {
  const now = new Date();
  await Notification.updateMany(
    {
      user: userId,
      status: { $in: ['unread', 'read'] },
      expiresAt: { $ne: null, $lte: now },
    },
    {
      $set: {
        status: 'expired',
      },
    }
  );
}

/**
 * Computes verified, reliable notification counters.
 * Dismissed and expired notifications are never counted in unread or active.
 */
async function getNotificationCounts(userId) {
  await expireOldNotifications(userId);

  const now = new Date();
  const activeValidity = {
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  const [unread, active, completed, total] = await Promise.all([
    Notification.countDocuments({
      user: userId,
      status: 'unread',
      ...activeValidity,
    }),
    Notification.countDocuments({
      user: userId,
      status: { $in: ['unread', 'read'] },
      ...activeValidity,
    }),
    Notification.countDocuments({
      user: userId,
      status: 'completed',
    }),
    Notification.countDocuments({
      user: userId,
      status: { $in: ['unread', 'read', 'completed'] },
      ...activeValidity,
    }),
  ]);

  return {
    unread,
    active,
    completed,
    total,
  };
}

/**
 * Contextual notification generator.
 * Only triggers sensible notifications based on real activities.
 * Avoids re-inserting welcome notifications if user has dismissed them!
 */
async function generateContextualNotifications(userId) {
  await expireOldNotifications(userId);

  // Check if ANY notification has EVER been created for this user
  const totalHistoricCount = await Notification.countDocuments({ user: userId });
  if (totalHistoricCount === 0) {
    // Only seed onboarding notifications for a truly brand-new user with 0 history
    const welcomeNotifications = [
      {
        user: userId,
        title: '24 Timed Mock Tests Ready',
        message: 'Full-length and sectional pattern tests for TCS, Infosys, Cognizant and more are now active.',
        type: 'test',
        link: '/mocks',
        entityType: 'onboarding',
        entityId: 'mocks-welcome',
        status: 'unread',
        read: false,
      },
      {
        user: userId,
        title: 'Daily Coding & SQL Labs',
        message: 'Practice verified problems linked directly with official LeetCode problems.',
        type: 'drill',
        link: '/coding',
        entityType: 'onboarding',
        entityId: 'coding-welcome',
        status: 'unread',
        read: false,
      },
      {
        user: userId,
        title: 'Placement 2027 Syllabus Explorer',
        message: 'Explore company-wise section syllabi, question counts, and start topic drills.',
        type: 'recommendation',
        link: '/drill',
        entityType: 'onboarding',
        entityId: 'drill-welcome',
        status: 'unread',
        read: false,
      },
    ];
    await Notification.insertMany(welcomeNotifications);
    return;
  }

  // Check user activity to see if streak or practice notifications are warranted
  const user = await User.findById(userId).lean();
  if (!user) return;

  // Streak reminder / celebration
  if (user.streak && user.streak >= 3) {
    const streakKey = `streak-${user.streak}`;
    const exists = await Notification.findOne({
      user: userId,
      entityType: 'streak',
      entityId: streakKey,
    });
    if (!exists) {
      await createNotification(userId, {
        title: `🔥 ${user.streak}-Day Study Streak!`,
        message: `Incredible dedication! You have maintained a ${user.streak}-day active practice streak. Keep the momentum going!`,
        type: 'streak',
        link: '/practice',
        entityType: 'streak',
        entityId: streakKey,
      });
    }
  }

  // Target company reminders
  if (Array.isArray(user.targetCompanies) && user.targetCompanies.length > 0) {
    const topCompany = user.targetCompanies[0];
    const companyKey = `target-${topCompany}`;
    const exists = await Notification.findOne({
      user: userId,
      entityType: 'target_company',
      entityId: companyKey,
    });
    if (!exists) {
      await createNotification(userId, {
        title: `Target Company: ${topCompany.toUpperCase()}`,
        message: `Check out the latest placement patterns, syllabus, and company-specific mock tests for ${topCompany.toUpperCase()}.`,
        type: 'recommendation',
        link: `/companies/${topCompany}`,
        entityType: 'target_company',
        entityId: companyKey,
      });
    }
  }
}

module.exports = {
  createNotification,
  resolveNotification,
  expireOldNotifications,
  getNotificationCounts,
  generateContextualNotifications,
};
