const fs = require('fs');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Cleanup uploaded file on error
  if (req.file && fs.existsSync(req.file.path)) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupErr) {
      console.error('Error cleaning up file:', cleanupErr);
    }
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
