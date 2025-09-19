const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    unique: true,
    sparse: true,
    index: true
  },
  imdbId: {
    type: String,
    sparse: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  originalTitle: {
    type: String,
    trim: true
  },
  overview: {
    type: String,
    maxlength: [2000, 'Overview cannot exceed 2000 characters']
  },
  releaseDate: {
    type: Date,
    index: true
  },
  runtime: {
    type: Number,
    min: [1, 'Runtime must be at least 1 minute']
  },
  genres: [{
    type: String,
    trim: true,
    index: true
  }],
  cast: [{
    id: Number,
    name: {
      type: String,
      trim: true
    },
    character: {
      type: String,
      trim: true
    },
    profilePath: String,
    order: Number
  }],
  crew: [{
    id: Number,
    name: {
      type: String,
      trim: true
    },
    job: {
      type: String,
      trim: true
    },
    department: String,
    profilePath: String
  }],
  posterPath: String,
  backdropPath: String,
  voteAverage: {
    type: Number,
    min: [0, 'Vote average cannot be negative'],
    max: [10, 'Vote average cannot exceed 10'],
    index: true
  },
  voteCount: {
    type: Number,
    min: [0, 'Vote count cannot be negative']
  },
  popularity: {
    type: Number,
    min: [0, 'Popularity cannot be negative'],
    index: true
  },
  adult: {
    type: Boolean,
    default: false,
    index: true
  },
  originalLanguage: {
    type: String,
    trim: true,
    index: true
  },
  productionCompanies: [{
    type: String,
    trim: true
  }],
  productionCountries: [{
    type: String,
    trim: true
  }],
  spokenLanguages: [{
    type: String,
    trim: true
  }],
  tagline: {
    type: String,
    trim: true,
    maxlength: [300, 'Tagline cannot exceed 300 characters']
  },
  status: {
    type: String,
    enum: ['Rumored', 'Planned', 'In Production', 'Post Production', 'Released', 'Canceled'],
    default: 'Released'
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  revenue: {
    type: Number,
    min: [0, 'Revenue cannot be negative']
  },
  homepage: {
    type: String,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  videos: [{
    id: String,
    key: String,
    name: String,
    site: String,
    type: String,
    official: Boolean
  }],
  // Local ratings and reviews
  localRatings: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
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

// Compound indexes for better search performance
movieSchema.index({ title: 'text', overview: 'text', genres: 'text' });
movieSchema.index({ genres: 1, voteAverage: -1 });
movieSchema.index({ releaseDate: -1, popularity: -1 });
movieSchema.index({ voteAverage: -1, voteCount: -1 });

// Virtual for year
movieSchema.virtual('year').get(function() {
  return this.releaseDate ? this.releaseDate.getFullYear() : null;
});

// Virtual for directors
movieSchema.virtual('directors').get(function() {
  return this.crew.filter(person => person.job === 'Director');
});

// Virtual for main actors (top 5)
movieSchema.virtual('mainActors').get(function() {
  return this.cast
    .sort((a, b) => (a.order || 999) - (b.order || 999))
    .slice(0, 5);
});

// Virtual for poster URL
movieSchema.virtual('posterUrl').get(function() {
  return this.posterPath ? `https://image.tmdb.org/t/p/w500${this.posterPath}` : null;
});

// Virtual for backdrop URL
movieSchema.virtual('backdropUrl').get(function() {
  return this.backdropPath ? `https://image.tmdb.org/t/p/w1280${this.backdropPath}` : null;
});

// Method to update local ratings
movieSchema.methods.updateLocalRating = function(newRating) {
  const currentTotal = this.localRatings.totalRatings;
  const currentAverage = this.localRatings.averageRating;
  
  const newTotal = currentTotal + 1;
  const newAverage = ((currentAverage * currentTotal) + newRating) / newTotal;
  
  this.localRatings.totalRatings = newTotal;
  this.localRatings.averageRating = Math.round(newAverage * 10) / 10; // Round to 1 decimal
  
  return this.save();
};

// Method to get similar movies (basic implementation)
movieSchema.methods.getSimilarMovies = function(limit = 10) {
  return this.model('Movie').find({
    _id: { $ne: this._id },
    genres: { $in: this.genres },
    isActive: true
  })
  .sort({ voteAverage: -1, popularity: -1 })
  .limit(limit);
};

// Static method to get movies by genre
movieSchema.statics.getByGenre = function(genre, limit = 20, sortBy = 'popularity') {
  const sortOption = {};
  sortOption[sortBy] = -1;
  
  return this.find({ 
    genres: genre, 
    isActive: true 
  })
  .sort(sortOption)
  .limit(limit);
};

// Static method for advanced search
movieSchema.statics.advancedSearch = function(searchOptions) {
  const {
    query,
    genres,
    year,
    minRating,
    maxRating,
    language,
    sortBy = 'popularity',
    page = 1,
    limit = 20
  } = searchOptions;

  let mongoQuery = { isActive: true };
  let sort = {};

  // Text search
  if (query) {
    mongoQuery.$text = { $search: query };
  }

  // Genre filter
  if (genres && genres.length > 0) {
    mongoQuery.genres = { $in: genres };
  }

  // Year filter
  if (year) {
    mongoQuery.releaseDate = {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${parseInt(year) + 1}-01-01`)
    };
  }

  // Rating filter
  if (minRating !== undefined || maxRating !== undefined) {
    mongoQuery.voteAverage = {};
    if (minRating !== undefined) mongoQuery.voteAverage.$gte = minRating;
    if (maxRating !== undefined) mongoQuery.voteAverage.$lte = maxRating;
  }

  // Language filter
  if (language) {
    mongoQuery.originalLanguage = language;
  }

  // Sort options
  switch (sortBy) {
    case 'rating':
      sort = { voteAverage: -1, voteCount: -1 };
      break;
    case 'popularity':
      sort = { popularity: -1 };
      break;
    case 'release_date':
      sort = { releaseDate: -1 };
      break;
    case 'title':
      sort = { title: 1 };
      break;
    default:
      sort = { popularity: -1 };
  }

  const skip = (page - 1) * limit;

  return this.find(mongoQuery)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Movie', movieSchema);
