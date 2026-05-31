const Image = require('../models/Image');
const cloudinary = require('../config/cloudinary');

/**
 * GET /api/images
 * Fetch paginated images with optional search/filter
 */
const getImages = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'newest';
    const search = req.query.search ? req.query.search.trim() : '';
    const tag = req.query.tag ? req.query.tag.trim() : '';

    // Build query
    let query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { likes: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }

    const [images, total] = await Promise.all([
      Image.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      Image.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/images/:id
 * Fetch single image + increment views
 */
const getImageById = async (req, res, next) => {
  try {
    const image = await Image.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true, select: '-__v' }
    ).lean();

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/images/upload
 * Upload image to Cloudinary and save metadata
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const { title = '', description = '', tags = '' } = req.body;

    // Parse tags
    const parsedTags = tags
      ? tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0 && t.length <= 30)
          .slice(0, 10)
      : [];

    // Cloudinary metadata from multer-storage-cloudinary
    const cloudinaryId = req.file.filename || req.file.public_id;
    const imageUrl = req.file.path || req.file.secure_url;

    const image = await Image.create({
      imageUrl,
      cloudinaryId,
      title: title.slice(0, 100),
      description: description.slice(0, 500),
      tags: parsedTags,
      width: req.file.width || 0,
      height: req.file.height || 0,
      fileSize: req.file.size || 0,
      format: req.file.format || '',
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: image,
    });
  } catch (error) {
    // If DB save fails but Cloudinary upload succeeded, clean up
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed:', cleanupError.message);
      }
    }
    next(error);
  }
};

/**
 * PUT /api/images/like/:id
 * Toggle-style like (increment only — no auth)
 */
const likeImage = async (req, res, next) => {
  try {
    const image = await Image.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true, select: 'likes _id' }
    );

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.json({ success: true, data: { likes: image.likes, id: image._id } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/images/comment/:id
 * Add comment to image
 */
const commentImage = async (req, res, next) => {
  try {
    const { text, author } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const sanitizedText = text.trim().slice(0, 500);
    const sanitizedAuthor = author ? author.trim().slice(0, 50) : 'Anonymous';

    const image = await Image.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            $each: [{ text: sanitizedText, author: sanitizedAuthor }],
            $position: 0,
            $slice: 200, // max 200 comments
          },
        },
      },
      { new: true, select: 'comments _id' }
    );

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added',
      data: { comment: image.comments[0], commentCount: image.comments.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/images/:id
 * Delete image from DB and Cloudinary
 */
const deleteImage = async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Delete from Cloudinary
    if (image.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryId);
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr.message);
        // Continue with DB delete even if Cloudinary fails
      }
    }

    await Image.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/images/download/:id
 * Increment download count
 */
const recordDownload = async (req, res, next) => {
  try {
    const image = await Image.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true, select: 'downloads _id imageUrl' }
    );

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.json({ success: true, data: { downloads: image.downloads, imageUrl: image.imageUrl } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getImages,
  getImageById,
  uploadImage,
  likeImage,
  commentImage,
  deleteImage,
  recordDownload,
};
