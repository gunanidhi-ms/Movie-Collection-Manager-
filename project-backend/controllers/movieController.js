const Movie = require('../models/Movie');

// Get all movies with pagination
const getAllMovies = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const movies = await Movie.find({ isActive: true })
      .sort({ popularity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalMovies = await Movie.countDocuments({ isActive: true });

    res.json({
      success: true,
      movies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMovies / parseInt(limit)),
        totalMovies
      }
    });
  } catch (error) {
    console.error('Get all movies error:', error);
    res.status(500).json({ success: false, message: 'Error fetching movies' });
  }
};

// Get single movie by ID
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie || !movie.isActive) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.json({ success: true, movie });
  } catch (error) {
    console.error('Get movie error:', error);
    res.status(500).json({ success: false, message: 'Error fetching movie' });
  }
};

// Add a new movie
const addMovie = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json({ success: true, movie });
  } catch (error) {
    console.error('Add movie error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a movie
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.json({ success: true, movie });
  } catch (error) {
    console.error('Update movie error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a movie (soft delete)
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({ success: false, message: 'Error deleting movie' });
  }
};

// Get movies by genre
const getMoviesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 20, sortBy = 'popularity' } = req.query;

    const movies = await Movie.getByGenre(genre, parseInt(limit), sortBy);

    res.json({ success: true, movies });
  } catch (error) {
    console.error('Get movies by genre error:', error);
    res.status(500).json({ success: false, message: 'Error fetching movies by genre' });
  }
};

// Advanced search
const searchMovies = async (req, res) => {
  try {
    const movies = await Movie.advancedSearch(req.query);
    res.json({ success: true, movies });
  } catch (error) {
    console.error('Search movies error:', error);
    res.status(500).json({ success: false, message: 'Error searching movies' });
  }
};

// Add a local rating
const addLocalRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    await movie.updateLocalRating(rating);

    res.json({ success: true, message: 'Rating submitted successfully', movie });
  } catch (error) {
    console.error('Add rating error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get similar movies
const getSimilarMovies = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const similarMovies = await movie.getSimilarMovies(parseInt(req.query.limit) || 10);

    res.json({ success: true, similarMovies });
  } catch (error) {
    console.error('Get similar movies error:', error);
    res.status(500).json({ success: false, message: 'Error fetching similar movies' });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie,
  getMoviesByGenre,
  searchMovies,
  addLocalRating,
  getSimilarMovies
};
