const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const upload = require('../config/multer');
const { getProfile, updateProfile } = require('../controllers/profileController');
const validateRequest = require('../middleware/validateRequest');

// GET /api/profile
router.get('/', getProfile);

// PUT /api/profile
router.put(
  '/',
  upload.single('avatar'),
  [
    body('name').optional().isString().trim().isLength({ max: 60 }),
    body('bio').optional().isString().trim().isLength({ max: 300 }),
    body('location').optional().isString().trim().isLength({ max: 100 }),
    body('website').optional().isString().trim().isLength({ max: 200 }),
    body('socialLinks.instagram').optional().isString().trim().isLength({ max: 100 }),
    body('socialLinks.twitter').optional().isString().trim().isLength({ max: 100 }),
    body('socialLinks.linkedin').optional().isString().trim().isLength({ max: 100 }),
  ],
  validateRequest,
  updateProfile
);

module.exports = router;
