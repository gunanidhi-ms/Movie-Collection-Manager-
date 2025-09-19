// auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        let token;

        // Check for token in header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check for token in cookies (if you're using cookies)
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from database
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token is valid but user no longer exists'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User account is deactivated'
                });
            }

            // Add user to request object
            req.user = user;
            req.userId = user._id;

            next();
        } catch (jwtError) {
            console.error('JWT Error:', jwtError.message);

            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Token verification failed'
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId).select('-password');

                if (user && user.isActive) {
                    req.user = user;
                    req.userId = user._id;
                }
            } catch (jwtError) {
                // Token is invalid or expired, but we continue without user
                console.log('Optional auth failed:', jwtError.message);
            }
        }

        next();
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        next();
    }
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user is admin (you might want to add an isAdmin field to User model)
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error in admin verification'
        });
    }
};

// Rate limiting middleware for specific routes
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        const identifier = req.user ? req.user._id.toString() : req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!requests.has(identifier)) {
            requests.set(identifier, []);
        }

        const userRequests = requests.get(identifier);

        // Remove old requests outside the window
        const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
        requests.set(identifier, validRequests);

        if (validRequests.length >= max) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        validRequests.push(now);
        next();
    };
};

module.exports = {
    auth,
    optionalAuth,
    adminOnly,
    createRateLimit
};
