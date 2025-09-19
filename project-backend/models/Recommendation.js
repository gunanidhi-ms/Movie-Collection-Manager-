const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required for recommendation'],
        index: true
    },
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: [true, 'Movie is required for recommendation']
    },
    recommendationType: {
        type: String,
        enum: {
            values: ['genre_based', 'collaborative', 'content_based', 'trending', 'chatbot', 'similar_users'],
            message: 'Invalid recommendation type'
        },
        required: [true, 'Recommendation type is required'],
        index: true
    },
    score: {
        type: Number,
        required: [true, 'Recommendation score is required'],
        min: [0, 'Score cannot be negative'],
        max: [1, 'Score cannot exceed 1'],
        index: true
    },
    confidence: {
        type: Number,
        min: [0, 'Confidence cannot be negative'],
        max: [1, 'Confidence cannot exceed 1'],
        default: 0.5
    },
    reasons: [{
        type: String,
        trim: true,
        maxlength: [200, 'Reason cannot exceed 200 characters']
    }],
    tags: [{
        type: String,
        trim: true
    }],
    isViewed: {
        type: Boolean,
        default: false,
        index: true
    },
    feedback: {
        liked: {
            type: Boolean,
            default: null
        },
        dismissed: {
            type: Boolean,
            default: false
        },
        rating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5']
        },
        comment: {
            type: String,
            maxlength: [500, 'Comment cannot exceed 500 characters']
        },
        feedbackDate: {
            type: Date
        }
    },
    chatContext: {
        query: {
            type: String,
            trim: true,
            maxlength: [500, 'Query cannot exceed 500 characters']
        },
        intent: {
            type: String,
            trim: true
        },
        entities: [{
            type: String,
            trim: true
        }],
        sessionId: {
            type: String,
            trim: true
        }
    },
    metadata: {
        algorithm: {
            type: String,
            trim: true
        },
        version: {
            type: String,
            default: '1.0'
        },
        processingTime: {
            type: Number // in milliseconds
        },
        similarMovies: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie'
        }],
        basedOnMovies: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie'
        }]
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        index: { expireAfterSeconds: 0 }
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

// Compound indexes for efficient queries
recommendationSchema.index({ user: 1, createdAt: -1 });
recommendationSchema.index({ user: 1, recommendationType: 1, score: -1 });
recommendationSchema.index({ user: 1, isViewed: 1 });
recommendationSchema.index({ movie: 1, recommendationType: 1 });

// Virtual for age of recommendation
recommendationSchema.virtual('age').get(function () {
    return Date.now() - this.createdAt.getTime();
});

// Virtual for is fresh (less than 24 hours old)
recommendationSchema.virtual('isFresh').get(function () {
    const oneDayMs = 24 * 60 * 60 * 1000;
    return this.age < oneDayMs;
});

// Method to provide feedback
recommendationSchema.methods.provideFeedback = function (feedbackData) {
    this.feedback = {
        ...this.feedback,
        ...feedbackData,
        feedbackDate: new Date()
    };
    this.isViewed = true;
    return this.save();
};

// Method to mark as viewed
recommendationSchema.methods.markAsViewed = function () {
    this.isViewed = true;
    return this.save();
};

// Static method to get user recommendations
recommendationSchema.statics.getUserRecommendations = function (userId, options = {}) {
    const {
        type,
        limit = 20,
        includeViewed = false,
        minScore = 0,
        sortBy = 'score'
    } = options;

    let query = { user: userId, isActive: true };

    if (type && type !== 'all') {
        query.recommendationType = type;
    }

    if (!includeViewed) {
        query.isViewed = false;
    }

    if (minScore > 0) {
        query.score = { $gte: minScore };
    }

    const sortOptions = {};
    if (sortBy === 'score') {
        sortOptions.score = -1;
        sortOptions.createdAt = -1;
    } else if (sortBy === 'date') {
        sortOptions.createdAt = -1;
    } else if (sortBy === 'confidence') {
        sortOptions.confidence = -1;
        sortOptions.score = -1;
    }

    return this.find(query)
        .populate('movie')
        .sort(sortOptions)
        .limit(limit);
};

// Static method to get recommendation stats for user
recommendationSchema.statics.getUserStats = async function (userId) {
    const pipeline = [
        { $match: { user: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                viewed: { $sum: { $cond: ['$isViewed', 1, 0] } },
                liked: { $sum: { $cond: ['$feedback.liked', 1, 0] } },
                dismissed: { $sum: { $cond: ['$feedback.dismissed', 1, 0] } },
                avgScore: { $avg: '$score' },
                byType: {
                    $push: {
                        type: '$recommendationType',
                        score: '$score',
                        viewed: '$isViewed',
                        liked: '$feedback.liked'
                    }
                }
            }
        }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || {
        total: 0,
        viewed: 0,
        liked: 0,
        dismissed: 0,
        avgScore: 0,
        byType: []
    };
};

// Static method to clean old recommendations
recommendationSchema.statics.cleanOldRecommendations = function (daysOld = 30) {
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        'feedback.liked': { $ne: true } // Keep liked recommendations
    });
};

// Pre-save middleware to update expiry
recommendationSchema.pre('save', function (next) {
    if (this.feedback && this.feedback.liked === true) {
        // Extend expiry for liked recommendations
        this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    }
    next();
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
