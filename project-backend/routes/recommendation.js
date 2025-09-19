const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all recommendations
router.get('/', recommendationController.getRecommendations);

// Provide feedback
router.post('/:id/feedback', recommendationController.provideFeedback);

// Mark as viewed
router.post('/:id/viewed', recommendationController.markAsViewed);

// Get stats
router.get('/stats', recommendationController.getRecommendationStats);

// Clean old recommendations (admin use)
router.delete('/clean', recommendationController.cleanOldRecommendations);

module.exports = router;
