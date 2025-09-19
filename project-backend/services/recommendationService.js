// productService.js
// services/recommendationService.js
const Recommendation = require('../models/Recommendation');
const Movie = require('../models/Movie');

const recommendationService = {
  // Create recommendation entry
  async createRecommendation(userId, recommendedMovies, reason = '') {
    const recommendation = new Recommendation({
      user: userId,
      recommendedMovies,
      reason,
    });
    return await recommendation.save();
  },

  // Get recommendations for a user
  async getUserRecommendations(userId) {
    return await Recommendation.find({ user: userId })
      .populate('recommendedMovies', 'title genre releaseDate')
      .sort({ createdAt: -1 });
  },

  // Generate simple recommendations based on genre
  async recommendByGenre(genre) {
    return await Movie.find({ genre: new RegExp(genre, 'i') }).limit(10);
  },

  // Generate trending recommendations (dummy example: most recent)
  async recommendTrending() {
    return await Movie.find().sort({ createdAt: -1 }).limit(10);
  },
};

module.exports = recommendationService;
