const Profile = require('../models/Profile');
const cloudinary = require('../config/cloudinary');

/**
 * GET /api/profile
 * Get the singleton gallery profile
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.getOrCreate();
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 * Update profile fields (name, bio, location, website, socialLinks)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, location, website, socialLinks } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim().slice(0, 60);
    if (bio !== undefined) updateFields.bio = bio.trim().slice(0, 300);
    if (location !== undefined) updateFields.location = location.trim().slice(0, 100);
    if (website !== undefined) updateFields.website = website.trim().slice(0, 200);
    if (socialLinks) {
      if (socialLinks.instagram !== undefined)
        updateFields['socialLinks.instagram'] = socialLinks.instagram.trim().slice(0, 100);
      if (socialLinks.twitter !== undefined)
        updateFields['socialLinks.twitter'] = socialLinks.twitter.trim().slice(0, 100);
      if (socialLinks.linkedin !== undefined)
        updateFields['socialLinks.linkedin'] = socialLinks.linkedin.trim().slice(0, 100);
    }

    // Handle avatar upload if file included
    if (req.file) {
      const existingProfile = await Profile.findOne({ singleton: true });
      // Delete old avatar from Cloudinary
      if (existingProfile && existingProfile.avatarCloudinaryId) {
        try {
          await cloudinary.uploader.destroy(existingProfile.avatarCloudinaryId);
        } catch (err) {
          console.error('Old avatar cleanup error:', err.message);
        }
      }
      updateFields.avatar = req.file.path || req.file.secure_url;
      updateFields.avatarCloudinaryId = req.file.filename || req.file.public_id;
    }

    const profile = await Profile.findOneAndUpdate(
      { singleton: true },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, message: 'Profile updated', data: profile });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
