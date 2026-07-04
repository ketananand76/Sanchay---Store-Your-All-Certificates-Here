const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer not to say', ''],
      default: '',
    },
    privateAccount: {
      type: Boolean,
      default: false,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    links: {
      website: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    skills: {
      type: [String],
      default: [],
    },
    pushSubscription: {
      type: Object,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpires: {
      type: Date,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
    },
    aiScansCount: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['Job Seeker', 'Employer', 'HR Manager'],
      default: 'Job Seeker',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    experience: [
      {
        company: { type: String, required: true },
        title: { type: String, required: true },
        startDate: { type: String },
        endDate: { type: String },
        current: { type: Boolean, default: false },
        description: { type: String, default: '' },
      }
    ],
    education: [
      {
        school: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        description: { type: String, default: '' },
      }
    ],
    lastActiveLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      lastActive: { type: Date, default: Date.now }
    },
    isGovIdVerified: {
      type: Boolean,
      default: false
    },
    closeFriends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    stories: [
      {
        fileUrl: { type: String, required: true },
        fileType: { type: String, enum: ['image', 'video'], default: 'image' },
        audience: { type: String, enum: ['public', 'close-friends'], default: 'public' },
        filter: { type: String, default: 'none' },
        music: { type: String, default: '' },
        textOverlays: [
          {
            text: { type: String, default: '' },
            x: { type: Number, default: 50 },
            y: { type: Number, default: 50 },
            color: { type: String, default: '#ffffff' },
            fontSize: { type: Number, default: 16 },
            fontStyle: { type: String, default: 'modern' }
          }
        ],
        stickers: [
          {
            emoji: { type: String, default: '' },
            x: { type: Number, default: 50 },
            y: { type: Number, default: 50 },
            scale: { type: Number, default: 1 }
          }
        ],
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true }
      }
    ],
    highlights: [
      {
        title: { type: String, required: true },
        coverIcon: { type: String, default: 'Award' },
        stories: [
          {
            fileUrl: { type: String, required: true },
            fileType: { type: String, default: 'image' },
            createdAt: { type: Date, default: Date.now }
          }
        ],
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

