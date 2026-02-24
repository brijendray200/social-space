class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    err = new ErrorHandler(message, 400);
  }

  // MongoDB cast error
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new ErrorHandler(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = new ErrorHandler(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { ErrorHandler, errorMiddleware };
