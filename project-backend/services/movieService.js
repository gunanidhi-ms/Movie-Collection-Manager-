// orderService.js
// services/movieService.js
const Movie = require('../models/Movie');
const Collection = require('../models/Collection');

const movieService = {
  // Add a movie to DB
  async createMovie(movieData) {
    const movie = new Movie(movieData);
    return await movie.save();
  },

  // Find movie by ID
  async getMovieById(movieId) {
    return await Movie.findById(movieId);
  },

  // Search movies by title
  async searchMovies(query) {
    return await Movie.find({ title: new RegExp(query, 'i') });
  },

  // Add movie to a collection
  async addMovieToCollection(collectionId, movieId) {
    const collection = await Collection.findById(collectionId);
    if (!collection) throw new Error('Collection not found');

    if (!collection.movies.includes(movieId)) {
      collection.movies.push(movieId);
      await collection.save();
    }
    return collection;
  },

  // Remove movie from a collection
  async removeMovieFromCollection(collectionId, movieId) {
    const collection = await Collection.findById(collectionId);
    if (!collection) throw new Error('Collection not found');

    collection.movies = collection.movies.filter(
      (id) => id.toString() !== movieId.toString()
    );
    await collection.save();
    return collection;
  },
};

module.exports = movieService;
