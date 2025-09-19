// User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  preferences: {
    favoriteGenres: [{
      type: String,
      trim: true
    }],
    favoriteActors: [{
      type: String,
      trim: true
    }],
    favoriteDirectors: [{
      type: String,
      trim: true
    }],
    preferredLanguages: [{
      type: String,
      trim: true
    }],
    adultContent: {
      type: Boolean,
      default: false
    }
  },
  watchHistory: [{
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating cannot exceed 10']
    },
    review: {
      type: String,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    }
  }],
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: false
    },
    allowRecommendations: {
      type: Boolean,
      default: true
    }
  },
  lastActive: {
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

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'watchHistory.movieId': 1 });

// Virtual for total movies watched
userSchema.virtual('totalMoviesWatched').get(function() {
  return this.watchHistory.length;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastActive on save
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActive = Date.now();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Get public profile method
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    avatar: this.avatar,
    bio: this.bio,
    totalMoviesWatched: this.totalMoviesWatched,
    joinedAt: this.createdAt,
    favoriteGenres: this.preferences.favoriteGenres
  };
};

module.exports = mongoose.model('User', userSchema);
