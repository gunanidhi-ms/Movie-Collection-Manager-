const Recommendation = require('../models/Recommendation');

// Get all recommendations for a user
const getRecommendations = async (req, res) => {
  try {
    const { type, limit, includeViewed, minScore, sortBy } = req.query;

    const recommendations = await Recommendation.getUserRecommendations(req.userId, {
      type,
      limit: parseInt(limit) || 20,
      includeViewed: includeViewed === 'true',
      minScore: parseFloat(minScore) || 0,
      sortBy
    });

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations'
    });
  }
};

// Provide feedback on a recommendation
const provideFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedbackData = req.body;

    const recommendation = await Recommendation.findById(id);
    if (!recommendation) {
      return res.status(404).json({ success: false, message: 'Recommendation not found' });
    }

    if (recommendation.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await recommendation.provideFeedback(feedbackData);

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      recommendation
    });
  } catch (error) {
    console.error('Provide feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    });
  }
};

// Mark a recommendation as viewed
const markAsViewed = async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await Recommendation.findById(id);
    if (!recommendation) {
      return res.status(404).json({ success: false, message: 'Recommendation not found' });
    }

    if (recommendation.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await recommendation.markAsViewed();

    res.json({
      success: true,
      message: 'Recommendation marked as viewed',
      recommendation
    });
  } catch (error) {
    console.error('Mark as viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking recommendation as viewed'
    });
  }
};

// Get stats for a user's recommendations
const getRecommendationStats = async (req, res) => {
  try {
    const stats = await Recommendation.getUserStats(req.userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get recommendation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendation stats'
    });
  }
};

// Clean old recommendations (admin use)
const cleanOldRecommendations = async (req, res) => {
  try {
    const { daysOld } = req.query;
    const result = await Recommendation.cleanOldRecommendations(parseInt(daysOld) || 30);

    res.json({
      success: true,
      message: `Old recommendations cleaned up`,
      result
    });
  } catch (error) {
    console.error('Clean old recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning old recommendations'
    });
  }
};

module.exports = {
  getRecommendations,
  provideFeedback,
  markAsViewed,
  getRecommendationStats,
  cleanOldRecommendations
};
