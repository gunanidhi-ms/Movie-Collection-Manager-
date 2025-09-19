const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Collection name is required'],
        trim: true,
        minlength: [1, 'Collection name cannot be empty'],
        maxlength: [100, 'Collection name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Collection owner is required'],
        index: true
    },
    movies: [{
        movie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        personalRating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [10, 'Rating cannot exceed 10']
        },
        notes: {
            type: String,
            maxlength: [1000, 'Notes cannot exceed 1000 characters']
        },
        watchStatus: {
            type: String,
            enum: {
                values: ['want_to_watch', 'watching', 'watched', 'dropped'],
                message: 'Watch status must be one of: want_to_watch, watching, watched, dropped'
            },
            default: 'want_to_watch',
            index: true
        },
        watchedDate: {
            type: Date
        },
        isFavorite: {
            type: Boolean,
            default: false
        }
    }],
    isPublic: {
        type: Boolean,
        default: false,
        index: true
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        permissions: {
            type: String,
            enum: {
                values: ['read', 'write', 'admin'],
                message: 'Permission must be one of: read, write, admin'
            },
            default: 'read'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    category: {
        type: String,
        enum: ['personal', 'watchlist', 'favorites', 'custom'],
        default: 'personal'
    },
    coverImage: {
        type: String,
        trim: true
    },
    sortOrder: {
        field: {
            type: String,
            enum: ['addedAt', 'title', 'releaseDate', 'rating', 'personalRating'],
            default: 'addedAt'
        },
        direction: {
            type: String,
            enum: ['asc', 'desc'],
            default: 'desc'
        }
    },
    stats: {
        totalMovies: {
            type: Number,
            default: 0
        },
        totalRuntime: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        genreDistribution: [{
            genre: String,
            count: Number
        }]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
collectionSchema.index({ owner: 1, name: 1 });
collectionSchema.index({ name: 'text', description: 'text', tags: 'text' });
collectionSchema.index({ 'movies.movie': 1 });
collectionSchema.index({ 'collaborators.user': 1 });
collectionSchema.index({ isPublic: 1, updatedAt: -1 });

// Virtual for movie count
collectionSchema.virtual('movieCount').get(function () {
    return this.movies.length;
});

// Virtual for watched movies count
collectionSchema.virtual('watchedCount').get(function () {
    return this.movies.filter(movie => movie.watchStatus === 'watched').length;
});

// Virtual for favorite movies count
collectionSchema.virtual('favoriteCount').get(function () {
    return this.movies.filter(movie => movie.isFavorite).length;
});

// Pre-save middleware to update stats
collectionSchema.pre('save', async function (next) {
    if (this.isModified('movies')) {
        await this.updateStats();
    }
    next();
});

// Method to update collection stats
collectionSchema.methods.updateStats = async function () {
    const movies = await this.populate('movies.movie');

    this.stats.totalMovies = this.movies.length;

    // Calculate total runtime
    this.stats.totalRuntime = movies.movies.reduce((total, item) => {
        return total + (item.movie.runtime || 0);
    }, 0);

    // Calculate average rating
    const ratingsArray = movies.movies
        .map(item => item.personalRating)
        .filter(rating => rating != null);

    if (ratingsArray.length > 0) {
        this.stats.averageRating = Math.round(
            (ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length) * 10
        ) / 10;
    }

    // Calculate genre distribution
    const genreCount = {};
    movies.movies.forEach(item => {
        if (item.movie.genres) {
            item.movie.genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        }
    });

    this.stats.genreDistribution = Object.entries(genreCount)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count);

    return this;
};

// Method to add movie to collection
collectionSchema.methods.addMovie = function (movieId, options = {}) {
    // Check if movie already exists
    const existingIndex = this.movies.findIndex(
        item => item.movie.toString() === movieId.toString()
    );

    if (existingIndex !== -1) {
        throw new Error('Movie already exists in collection');
    }

    const movieItem = {
        movie: movieId,
        personalRating: options.personalRating,
        notes: options.notes,
        watchStatus: options.watchStatus || 'want_to_watch',
        watchedDate: options.watchedDate,
        isFavorite: options.isFavorite || false
    };

    this.movies.push(movieItem);
    return this.save();
};

// Method to remove movie from collection
collectionSchema.methods.removeMovie = function (movieId) {
    this.movies = this.movies.filter(
        item => item.movie.toString() !== movieId.toString()
    );
    return this.save();
};

// Method to update movie in collection
collectionSchema.methods.updateMovie = function (movieId, updates) {
    const movieIndex = this.movies.findIndex(
        item => item.movie.toString() === movieId.toString()
    );

    if (movieIndex === -1) {
        throw new Error('Movie not found in collection');
    }

    Object.assign(this.movies[movieIndex], updates);
    return this.save();
};

// Method to check if user has access
collectionSchema.methods.hasAccess = function (userId, requiredPermission = 'read') {
    // Owner has full access
    if (this.owner.toString() === userId.toString()) {
        return true;
    }

    // Public collections have read access
    if (this.isPublic && requiredPermission === 'read') {
        return true;
    }

    // Check collaborator permissions
    const collaborator = this.collaborators.find(
        collab => collab.user.toString() === userId.toString()
    );

    if (!collaborator) {
        return false;
    }

    const permissions = {
        'read': 1,
        'write': 2,
        'admin': 3
    };

    return permissions[collaborator.permissions] >= permissions[requiredPermission];
};

// Static method to get public collections
collectionSchema.statics.getPublicCollections = function (page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return this.find({
        isPublic: true,
        isActive: true,
        'stats.totalMovies': { $gt: 0 }
    })
        .populate('owner', 'username avatar')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static method to search collections
collectionSchema.statics.searchCollections = function (searchTerm, userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query = {
        $and: [
            {
                $or: [
                    { isPublic: true },
                    { owner: userId },
                    { 'collaborators.user': userId }
                ]
            },
            {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $in: [new RegExp(searchTerm, 'i')] } }
                ]
            },
            { isActive: true }
        ]
    };

    return this.find(query)
        .populate('owner', 'username avatar')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
};

module.exports = mongoose.model('Collection', collectionSchema);
