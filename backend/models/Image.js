const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    author: {
      type: String,
      trim: true,
      default: 'Anonymous',
      maxlength: [50, 'Author name cannot exceed 50 characters'],
    },
  },
  { timestamps: true }
);

const imageSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    cloudinaryId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Cannot have more than 10 tags',
      },
    },
    likes: {
      type: Number,
      default: 0,
      min: [0, 'Likes cannot be negative'],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      trim: true,
      default: '',
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
imageSchema.index({ createdAt: -1 });
imageSchema.index({ likes: -1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual: comment count
imageSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// Pre-save: generate thumbnail URL from Cloudinary
imageSchema.pre('save', function (next) {
  if (this.isModified('imageUrl') || this.isNew) {
    // Generate thumbnail transformation URL
    if (this.cloudinaryId) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      this.thumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_400,c_fill,q_auto,f_auto/${this.cloudinaryId}`;
    }
  }
  next();
});

module.exports = mongoose.model('Image', imageSchema);
