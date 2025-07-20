const errorHandler = (err, req, res, next) => {
  // 复制错误对象，避免直接修改
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack);
  
  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = { code: 'NOT_FOUND', message };
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered for [${field}], please use another value`;
    error = { code: 'DUPLICATE_FIELD', message };
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { code: 'VALIDATION_ERROR', message };
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'SERVER_ERROR',
      message: error.message || 'Server Error'
    }
  });
};

module.exports = errorHandler;
