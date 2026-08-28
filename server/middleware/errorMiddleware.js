const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Don't expose internal error details in production
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Something went wrong. Please try again.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
