const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
      default: 'Ravi',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: 'Photography enthusiast. Capturing moments that matter.',
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
    },
    avatarCloudinaryId: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    website: {
      type: String,
      trim: true,
      maxlength: [200, 'Website URL cannot exceed 200 characters'],
      default: '',
    },
    socialLinks: {
      instagram: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
    },
    // Singleton pattern - only one profile record
    singleton: {
      type: Boolean,
      default: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Static: get or create the singleton profile
profileSchema.statics.getOrCreate = async function () {
  let profile = await this.findOne({ singleton: true });
  if (!profile) {
    profile = await this.create({
      name: 'Ravi',
      bio: 'Photography enthusiast. Capturing moments that matter.',
      singleton: true,
    });
  }
  return profile;
};

module.exports = mongoose.model('Profile', profileSchema);
