const { body, validationResult } = require('express-validator');
const fs = require('fs');

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }
    next();
  },
];

const validateCertificate = [
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('issuer').notEmpty().withMessage('Issuer is required').trim(),
  body('dateIssued').isISO8601().withMessage('Valid date issued (YYYY-MM-DD) is required'),
  body('category').notEmpty().withMessage('Category is required').trim(),
  body('verifyUrl').optional({ checkFalsy: true }).isURL().withMessage('Verification link must be a valid URL'),
  body('featured').optional().customSanitizer(val => val === 'true' || val === true),
  body('order').optional().isInt().withMessage('Order must be an integer').toInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up file if validation failed
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('File cleanup error:', err);
        }
      }
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }
    next();
  },
];

module.exports = {
  validateLogin,
  validateCertificate,
};
