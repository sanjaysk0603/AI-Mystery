export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.statusCode || 500;
  const message = status >= 500 ? 'Something went wrong. Please try again.' : (error.message || 'Unexpected server error');
  return res.status(status).json({ error: { code: error.code || 'SERVER_ERROR', message } });
}
