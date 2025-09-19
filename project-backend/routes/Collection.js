const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const collectionController = require('../controllers/collectionController');

// ==================== Collection Routes ====================

// @route   POST /api/collections
// @desc    Create a new collection
// @access  Private
router.post('/', auth, collectionController.createCollection);

// @route   GET /api/collections
// @desc    Get collections for logged-in user
// @access  Private
router.get('/', auth, collectionController.getUserCollections);

// @route   GET /api/collections/public
// @desc    Get public collections (paginated)
// @access  Public
router.get('/public', optionalAuth, collectionController.getPublicCollections);

// @route   GET /api/collections/search
// @desc    Search collections (public + user accessible)
// @access  Private
router.get('/search', auth, collectionController.searchCollections);

// @route   GET /api/collections/:id
// @desc    Get single collection by ID
// @access  Private/Public (depending on collection visibility)
router.get('/:id', optionalAuth, collectionController.getCollectionById);

// @route   PUT /api/collections/:id
// @desc    Update collection details
// @access  Private (must be owner or collaborator with write/admin access)
router.put('/:id', auth, collectionController.updateCollection);

// @route   DELETE /api/collections/:id
// @desc    Delete a collection
// @access  Private (must be owner)
router.delete('/:id', auth, collectionController.deleteCollection);

// ==================== Movie Management in Collection ====================

// @route   POST /api/collections/:id/movies
// @desc    Add a movie to collection
// @access  Private
router.post('/:id/movies', auth, collectionController.addMovieToCollection);

// @route   PUT /api/collections/:id/movies/:movieId
// @desc    Update a movie in collection (rating, notes, etc.)
// @access  Private
router.put('/:id/movies/:movieId', auth, collectionController.updateMovieInCollection);

// @route   DELETE /api/collections/:id/movies/:movieId
// @desc    Remove a movie from collection
// @access  Private
router.delete('/:id/movies/:movieId', auth, collectionController.removeMovieFromCollection);

// ==================== Collaborator Management ====================

// @route   POST /api/collections/:id/collaborators
// @desc    Add collaborator to collection
// @access  Private (owner/admin only)
router.post('/:id/collaborators', auth, collectionController.addCollaborator);

// @route   PUT /api/collections/:id/collaborators/:userId
// @desc    Update collaborator permissions
// @access  Private (owner/admin only)
router.put('/:id/collaborators/:userId', auth, collectionController.updateCollaborator);

// @route   DELETE /api/collections/:id/collaborators/:userId
// @desc    Remove collaborator
// @access  Private (owner/admin only)
router.delete('/:id/collaborators/:userId', auth, collectionController.removeCollaborator);

module.exports = router;
