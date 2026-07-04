const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    upiId: {
      type: String,
      default: '9771735011@mbk',
    },
    amount: {
      type: Number,
      required: true,
    },
    planName: {
      type: String,
      required: true,
      enum: ['Basic Monthly', 'Pro Yearly'],
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
