const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
      recipientRole: req.user.role,
    }).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({ success: true, data: notifications });
  } catch (error) {
    return next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id, recipientRole: req.user.role },
      { $set: { readAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.json({ success: true, data: notification });
  } catch (error) {
    return next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, recipientRole: req.user.role, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listNotifications, markNotificationRead, markAllNotificationsRead };
