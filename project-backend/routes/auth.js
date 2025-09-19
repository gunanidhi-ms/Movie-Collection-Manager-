// auth.js
const express = require('express');
const router = express.Router();
const { auth, optionalAuth, adminOnly, createRateLimit } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Rate limiter (example: max 5 login attempts every 10 minutes)
const loginLimiter = createRateLimit(10 * 60 * 1000, 5);

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public (rate limited)
router.post('/login', loginLimiter, authController.login);

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, authController.updateProfile);

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, authController.updatePreferences);

// @route   PUT /api/auth/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth, authController.updateSettings);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', auth, authController.changePassword);

// @route   GET /api/auth/watch-history
// @desc    Get user watch history
// @access  Private
router.get('/watch-history', auth, authController.getWatchHistory);

// @route   POST /api/auth/watch-history
// @desc    Add movie to watch history
// @access  Private
router.post('/watch-history', auth, authController.addToWatchHistory);

// @route   GET /api/auth/admin/dashboard
// @desc    Example admin route
// @access  Admin only
router.get('/admin/dashboard', auth, adminOnly, (req, res) => {
  res.json({ success: true, message: 'Welcome to Admin Dashboard' });
});

module.exports = router;
