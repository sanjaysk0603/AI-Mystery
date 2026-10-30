export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.statusCode || 500;
  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(JSON.stringify({
      event: 'http_request_failed',
      method: req.method,
      path: req.path,
      status,
      error: { name: error?.name || 'Error', message: error?.message || String(error), stack: error?.stack || null },
    }));
  }
  const message = status >= 500 ? 'Something went wrong. Please try again.' : (error.message || 'Unexpected server error');
  return res.status(status).json({ error: { code: error.code || 'SERVER_ERROR', message } });
}
