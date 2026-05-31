const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const upload = require('../config/multer');
const {
  getImages,
  getImageById,
  uploadImage,
  likeImage,
  commentImage,
  deleteImage,
  recordDownload,
} = require('../controllers/imageController');
const validateRequest = require('../middleware/validateRequest');

// GET /api/images — list with pagination/search
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sort').optional().isIn(['newest', 'oldest', 'popular']),
    query('search').optional().isString().trim().isLength({ max: 100 }),
    query('tag').optional().isString().trim().isLength({ max: 50 }),
  ],
  validateRequest,
  getImages
);

// GET /api/images/:id — single image
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid image ID')],
  validateRequest,
  getImageById
);

// POST /api/images/upload — upload new image
router.post(
  '/upload',
  upload.single('image'),
  [
    body('title').optional().isString().trim().isLength({ max: 100 }),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    body('tags').optional().isString().trim().isLength({ max: 300 }),
  ],
  validateRequest,
  uploadImage
);

// PUT /api/images/like/:id — like image
router.put(
  '/like/:id',
  [param('id').isMongoId().withMessage('Invalid image ID')],
  validateRequest,
  likeImage
);

// POST /api/images/comment/:id — add comment
router.post(
  '/comment/:id',
  [
    param('id').isMongoId().withMessage('Invalid image ID'),
    body('text')
      .notEmpty()
      .withMessage('Comment text required')
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 }),
    body('author').optional().isString().trim().isLength({ max: 50 }),
  ],
  validateRequest,
  commentImage
);

// PUT /api/images/download/:id — record download
router.put(
  '/download/:id',
  [param('id').isMongoId().withMessage('Invalid image ID')],
  validateRequest,
  recordDownload
);

// DELETE /api/images/:id — delete image
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid image ID')],
  validateRequest,
  deleteImage
);

module.exports = router;
