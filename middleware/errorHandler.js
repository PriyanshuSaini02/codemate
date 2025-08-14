const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = {
            message,
            statusCode: 404
        };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        let message = 'Duplicate field value entered';

        // Extract field name from error
        if (err.keyPattern) {
            const field = Object.keys(err.keyPattern)[0];
            message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        }

        error = {
            message,
            statusCode: 400
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            message,
            statusCode: 400
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            message: 'Invalid token',
            statusCode: 401
        };
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            message: 'Token expired',
            statusCode: 401
        };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;