const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', movieController.getAllMovies);
router.get('/search', movieController.searchMovies);
router.get('/genre/:genre', movieController.getMoviesByGenre);
router.get('/:id', movieController.getMovieById);
router.get('/:id/similar', movieController.getSimilarMovies);

// Protected routes (require auth)
router.post('/', auth, movieController.addMovie);
router.put('/:id', auth, movieController.updateMovie);
router.delete('/:id', auth, movieController.deleteMovie);
router.post('/:id/rating', auth, movieController.addLocalRating);

module.exports = router;
