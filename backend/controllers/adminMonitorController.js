const User = require('../models/User');
const Certificate = require('../models/Certificate');

// GET /api/admin/users-monitor (Admin protected endpoint)
const getUsersAndCertificates = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });

    const monitorData = await Promise.all(
      users.map(async (user) => {
        const userCertificates = await Certificate.find({ uploadedBy: user._id }).sort({ createdAt: -1 });
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          followers: user.followers || [],
          following: user.following || [],
          certificateCount: userCertificates.length,
          certificates: userCertificates,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: monitorData.length,
      users: monitorData,
    });
  } catch (error) {
    next(error);
  }
};

const approveCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findById(id);

    if (!certificate) {
      res.status(404);
      throw new Error('Certificate not found');
    }

    certificate.status = 'approved';
    await certificate.save();

    // Socket update dispatch
    const io = req.app.get('socketio');
    if (io && certificate.uploadedBy) {
      io.to(String(certificate.uploadedBy)).emit('status-update', {
        id: certificate._id,
        title: certificate.title,
        status: 'approved',
      });
    }

    // Trigger approval notification
    if (certificate.uploadedBy) {
      const { createNotification } = require('./notificationController');
      await createNotification(req.app, {
        recipient: certificate.uploadedBy,
        sender: null,
        type: 'approval',
        message: `Your certificate "${certificate.title}" has been approved by the Administrator.`,
        relatedId: certificate._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate approved successfully',
      certificate,
    });
  } catch (error) {
    next(error);
  }
};

const rejectCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findById(id);

    if (!certificate) {
      res.status(404);
      throw new Error('Certificate not found');
    }

    certificate.status = 'rejected';
    await certificate.save();

    // Socket update dispatch
    const io = req.app.get('socketio');
    if (io && certificate.uploadedBy) {
      io.to(String(certificate.uploadedBy)).emit('status-update', {
        id: certificate._id,
        title: certificate.title,
        status: 'rejected',
      });
    }

    // Trigger reject notification
    if (certificate.uploadedBy) {
      const { createNotification } = require('./notificationController');
      await createNotification(req.app, {
        recipient: certificate.uploadedBy,
        sender: null,
        type: 'reject',
        message: `Your certificate "${certificate.title}" was rejected by the Administrator.`,
        relatedId: certificate._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate rejected successfully',
      certificate,
    });
  } catch (error) {
    next(error);
  }
};

const Alert = require('../models/Alert');

const getAdminAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, alerts });
  } catch (error) {
    next(error);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Alert.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Alert cleared' });
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.status = 'active';
    await user.save();
    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/broadcast
const broadcastNotification = async (req, res, next) => {
  try {
    const { type, message } = req.body;

    if (!message || !message.trim()) {
      res.status(400);
      throw new Error('Broadcast message content is required');
    }

    const broadcastType = ['event', 'alert', 'system'].includes(type) ? type : 'system';
    
    // Find all active users
    const users = await User.find({ status: 'active' });
    
    // Create notification for all users
    const { createNotification } = require('./notificationController');
    
    for (const user of users) {
      await createNotification(req.app, {
        recipient: user._id,
        sender: null,
        type: broadcastType,
        message: message.trim(),
        relatedId: '',
      });
    }

    res.status(200).json({
      success: true,
      message: `Broadcast message sent successfully to ${users.length} active users.`,
      count: users.length
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/active-locations
const getActiveUsersLocations = async (req, res, next) => {
  try {
    const users = await User.find({ 
      'lastActiveLocation.latitude': { $ne: null },
      'lastActiveLocation.longitude': { $ne: null }
    }).select('name email role lastActiveLocation');

    res.status(200).json({
      success: true,
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        location: u.lastActiveLocation
      }))
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/update-location
const updateUserLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, city, country } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.lastActiveLocation = {
      latitude,
      longitude,
      city: city || 'Unknown City',
      country: country || 'Unknown Country',
      lastActive: new Date()
    };
    await user.save();

    // Broadcast to active admin socket room
    const io = req.app.get('socketio');
    if (io) {
      io.to('admin').emit('user-location-updated', {
        userId: user._id,
        name: user.name,
        role: user.role,
        location: user.lastActiveLocation
      });
    }

    res.status(200).json({
      success: true,
      message: 'Active location updated successfully',
      location: user.lastActiveLocation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsersAndCertificates,
  approveCertificate,
  rejectCertificate,
  getAdminAlerts,
  deleteAlert,
  unblockUser,
  broadcastNotification,
  getActiveUsersLocations,
  updateUserLocation,
};
