/**
 * Centralized Error Handling Middleware
 * Prevents credential leakage and delivers consistent JSON responses.
 */
export function errorHandler(err, req, res, next) {
  // Safe console log for server-side debugging (excluding any sensitive headers/tokens)
  console.error('[API Error]:', err.name, '-', err.message);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: messages.join(' '),
    });
  }

  // Mongoose Duplicate Key Error (e.g. entry ID collision)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'An entry with this identifier already exists.',
    });
  }

  // Mongoose Cast Error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource format for field: ${err.path}`,
    });
  }

  // Default Internal Error
  const statusCode = err.status || err.statusCode || 500;
  const clientMessage =
    statusCode === 500
      ? 'An unexpected error occurred while processing your request.'
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
  });
}
