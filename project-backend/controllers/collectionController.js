const Collection = require('../models/Collection');
const Movie = require('../models/Movie');
const { validationResult } = require('express-validator');

/**
 * Get all collections for a user
 */
const getUserCollections = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'updatedAt', category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      $or: [
        { owner: req.userId },
        { 'collaborators.user': req.userId },
        { isPublic: true }
      ],
      isActive: true
    };

    if (category) query.category = category;

    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'created':
        sort = { createdAt: -1 };
        break;
      case 'movieCount':
        sort = { 'stats.totalMovies': -1 };
        break;
      default:
        sort = { updatedAt: -1 };
    }

    const [collections, total] = await Promise.all([
      Collection.find(query)
        .populate('owner', 'username avatar')
        .populate({
          path: 'movies.movie',
          select: 'title posterPath releaseDate genres voteAverage',
          match: { isActive: true }
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Collection.countDocuments(query)
    ]);

    res.json({
      success: true,
      collections,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCollections: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get user collections error:', error);
    res.status(500).json({ success: false, message: 'Error fetching collections' });
  }
};

/**
 * Create new collection
 */
const createCollection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, isPublic, tags, category, coverImage } = req.body;

    // Check duplicate
    const existingCollection = await Collection.findOne({
      owner: req.userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true
    });

    if (existingCollection) {
      return res.status(400).json({ success: false, message: 'You already have a collection with this name' });
    }

    const collection = new Collection({
      name: name.trim(),
      description: description?.trim(),
      owner: req.userId,
      isPublic: isPublic || false,
      tags: tags || [],
      category: category || 'personal',
      coverImage
    });

    await collection.save();
    await collection.populate('owner', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection
    });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ success: false, message: 'Error creating collection' });
  }
};

/**
 * Get collection by ID
 */
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, sortBy = 'addedAt' } = req.query;

    const collection = await Collection.findById(id)
      .populate('owner', 'username avatar bio')
      .populate('collaborators.user', 'username avatar')
      .populate('collaborators.addedBy', 'username');

    if (!collection || !collection.isActive) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    // Access control
    if (!collection.hasAccess(req.userId, 'read')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Sort movies
    let sortedMovies = [...collection.movies];
    switch (sortBy) {
      case 'title':
        await collection.populate('movies.movie', 'title posterPath releaseDate genres voteAverage runtime');
        sortedMovies.sort((a, b) => a.movie.title.localeCompare(b.movie.title));
        break;
      case 'rating':
        sortedMovies.sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0));
        break;
      case 'releaseDate':
        await collection.populate('movies.movie', 'title posterPath releaseDate genres voteAverage runtime');
        sortedMovies.sort((a, b) => new Date(b.movie.releaseDate || 0) - new Date(a.movie.releaseDate || 0));
        break;
      default:
        sortedMovies.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }

    // Paginate movies
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedMovies = sortedMovies.slice(skip, skip + parseInt(limit));

    if (sortBy !== 'title' && sortBy !== 'releaseDate') {
      const movieIds = paginatedMovies.map(item => item.movie);
      const movies = await Movie.find({ _id: { $in: movieIds } })
        .select('title posterPath releaseDate genres voteAverage runtime');

      const movieMap = new Map(movies.map(movie => [movie._id.toString(), movie]));
      paginatedMovies.forEach(item => {
        item.movie = movieMap.get(item.movie.toString());
      });
    }

    res.json({
      success: true,
      collection: {
        ...collection.toObject(),
        movies: paginatedMovies,
        moviesPagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(collection.movies.length / parseInt(limit)),
          totalMovies: collection.movies.length,
          hasNext: skip + parseInt(limit) < collection.movies.length,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get collection by ID error:', error);
    res.status(error.name === 'CastError' ? 400 : 500).json({
      success: false,
      message: error.name === 'CastError' ? 'Invalid collection ID' : 'Error fetching collection'
    });
  }
};

/**
 * Update collection
 */
const updateCollection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, isPublic, tags, coverImage } = req.body;

    const collection = await Collection.findById(id);
    if (!collection || !collection.isActive) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    if (!collection.hasAccess(req.userId, 'write')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (name && name.trim() !== collection.name) {
      const existingCollection = await Collection.findOne({
        owner: collection.owner,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id },
        isActive: true
      });
      if (existingCollection) {
        return res.status(400).json({ success: false, message: 'Collection with this name exists' });
      }
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (tags) updates.tags = tags;
    if (coverImage !== undefined) updates.coverImage = coverImage;

    const updatedCollection = await Collection.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    })
      .populate('owner', 'username avatar')
      .populate('movies.movie', 'title posterPath releaseDate genres voteAverage');

    res.json({ success: true, message: 'Collection updated', collection: updatedCollection });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ success: false, message: 'Error updating collection' });
  }
};

/**
 * Delete collection
 */
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);
    if (!collection || !collection.isActive) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    if (collection.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only owner can delete' });
    }

    collection.isActive = false;
    await collection.save();

    res.json({ success: true, message: 'Collection deleted' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ success: false, message: 'Error deleting collection' });
  }
};

/**
 * Add movie to collection
 */
const addMovieToCollection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id: collectionId } = req.params;
    const { movieId, personalRating, notes, watchStatus, isFavorite } = req.body;

    const [collection, movie] = await Promise.all([
      Collection.findById(collectionId),
      Movie.findById(movieId)
    ]);

    if (!collection || !collection.isActive) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }
    if (!movie || !movie.isActive) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    if (!collection.hasAccess(req.userId, 'write')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (collection.movies.find(item => item.movie.toString() === movieId)) {
      return res.status(400).json({ success: false, message: 'Movie already in collection' });
    }

    const movieItem = {
      movie: movieId,
      personalRating,
      notes: notes?.trim(),
      watchStatus: watchStatus || 'want_to_watch',
      isFavorite: isFavorite || false,
      addedAt: new Date()
    };

    collection.movies.push(movieItem);
    await collection.save();
    await collection.updateStats();

    await collection.populate({
      path: 'movies.movie',
      match: { _id: movieId },
      select: 'title posterPath releaseDate genres voteAverage runtime'
    });

    res.status(201).json({ success: true, message: 'Movie added', collection });
  } catch (error) {
    console.error('Add movie error:', error);
    res.status(500).json({ success: false, message: 'Error adding movie' });
  }
};

module.exports = {
  getUserCollections,
  createCollection,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addMovieToCollection
};
