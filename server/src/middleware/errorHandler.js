const errorHandler = (err, req, res, next) => {
  console.error(err);

  const isClientInputError =
    err.type === 'entity.parse.failed' ||
    err.name === 'ValidationError' ||
    err.name === 'CastError';
  const statusCode = err.statusCode || (isClientInputError ? 400 : 500);
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Server error. Please try again later.'
    : err.message || 'Server error';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
