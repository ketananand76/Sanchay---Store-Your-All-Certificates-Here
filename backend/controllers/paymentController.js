const Payment = require('../models/Payment');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');

// POST /api/payments/request
exports.requestPremium = async (req, res, next) => {
  try {
    const { planName, utrNumber } = req.body;
    const userId = req.user.id;

    if (!planName || !utrNumber) {
      return res.status(400).json({ success: false, message: 'Plan name and UTR number are required.' });
    }

    // Validate UTR format (12-digit numeric)
    const utrRegex = /^\d{12}$/;
    if (!utrRegex.test(utrNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid UTR format. It must be a 12-digit transaction ID.' });
    }

    // Check if UTR is already in use
    const existingPayment = await Payment.findOne({ utrNumber });
    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'This transaction UTR number has already been submitted.' });
    }

    // Determine amount based on plan
    let amount = 99;
    if (planName === 'Pro Yearly') {
      amount = 499;
    } else if (planName !== 'Basic Monthly') {
      return res.status(400).json({ success: false, message: 'Invalid plan selected.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Create Payment record
    const payment = await Payment.create({
      user: userId,
      planName,
      amount,
      utrNumber,
      status: 'pending',
    });

    // Create Admin Alert
    await Alert.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      reason: `Premium Upgrade requested (Plan: ${planName}, UTR: ${utrNumber})`,
      status: 'unread',
    });

    res.status(201).json({
      success: true,
      message: 'Payment verification request submitted successfully.',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/my-status
exports.getMyPaymentStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/admin/pending (Admin protected)
exports.getPendingPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('user', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

// PUT /api/payments/admin/:id/verify (Admin protected)
exports.verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status.' });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Payment already marked as ${payment.status}.` });
    }

    payment.status = status;
    await payment.save();

    if (status === 'approved') {
      const user = await User.findById(payment.user);
      if (user) {
        user.isPremium = true;
        
        // Calculate expiry date
        const now = new Date();
        const durationDays = payment.planName === 'Pro Yearly' ? 365 : 30;
        const baseDate = user.premiumExpiresAt && user.premiumExpiresAt > now ? user.premiumExpiresAt : now;
        user.premiumExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        
        await user.save();

        // Create notification for user
        await Notification.create({
          recipient: user._id,
          type: 'approval',
          message: `Congratulations! Your UPI payment of ₹${payment.amount} has been verified and your Premium status has been unlocked until ${user.premiumExpiresAt.toLocaleDateString()}.`,
        });
      }
    } else {
      // Create notification for user about rejection
      await Notification.create({
        recipient: payment.user,
        type: 'reject',
        message: `Your payment verification request with UTR: ${payment.utrNumber} was rejected by the admin. Please double-check your payment details and try again.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment verification status updated to ${status}.`,
      payment,
    });
  } catch (error) {
    next(error);
  }
};
