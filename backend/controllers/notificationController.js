const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Global helper to create and trigger notifications
const createNotification = async (app, { recipient, sender, type, message, relatedId }) => {
  try {
    const notif = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      message,
      relatedId: relatedId || '',
    });

    // Populate sender info before emitting socket
    const populated = await Notification.findById(notif._id).populate('sender', 'name email profilePicture');

    // Emit live WebSocket update to recipient's personal room
    const io = app.get('socketio');
    if (io) {
      io.to(String(recipient)).emit('new-notification', populated);
    }
    return populated;
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
  }
  return null;
};

module.exports = {
  getNotifications,
  markAllAsRead,
  createNotification,
};
