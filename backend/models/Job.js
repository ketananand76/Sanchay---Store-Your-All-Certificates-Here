const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
      default: 'Full-time',
    },
    description: {
      type: String,
      required: true,
    },
    salary: {
      type: String,
      default: '',
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        resumeUrl: {
          type: String,
          default: '',
        },
        status: {
          type: String,
          enum: ['applied', 'shortlisted', 'rejected'],
          default: 'applied',
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
  },
  { timestamps: true }
);

// Pre-validation hook to migrate legacy applicant formats (e.g. plain ObjectIds) to subdocuments
jobSchema.pre('validate', function (next) {
  if (this.applicants && this.applicants.length > 0) {
    this.applicants = this.applicants.map(app => {
      if (app) {
        // If the entry is a plain ObjectId or ObjectId string
        if (mongoose.Types.ObjectId.isValid(app) && typeof app !== 'object') {
          return {
            user: app,
            resumeUrl: '',
            status: 'applied',
            appliedAt: new Date()
          };
        }
        
        // If it's a subdocument/object but missing the user property
        const appObj = typeof app.toObject === 'function' ? app.toObject() : app;
        if (!appObj.user) {
          return {
            user: appObj._id || new mongoose.Types.ObjectId(),
            resumeUrl: appObj.resumeUrl || '',
            status: appObj.status || 'applied',
            appliedAt: appObj.appliedAt || new Date()
          };
        }
      }
      return app;
    });
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);
