# Cloudinary Setup Guide

## Step 1 — Create Account

1. Go to https://cloudinary.com
2. Click **Sign Up for Free**
3. Fill in details → verify email

## Step 2 — Find Your Credentials

1. After login, go to the **Dashboard**
2. You will see your credentials in the **Product Environment Credentials** section:
   - **Cloud name** — e.g., `dxxxxxxxx`
   - **API Key** — e.g., `123456789012345`
   - **API Secret** — click the eye icon to reveal

## Step 3 — Set in .env

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Step 4 — Configure Upload Preset (Optional but Recommended)

The backend uses signed uploads via the API key/secret (no unsigned preset needed). No additional configuration is required.

## Step 5 — Verify Storage Folder

After your first upload, Cloudinary will automatically create a folder named `ravi-gallery` in your media library.

Go to **Media Library** → you should see the `ravi-gallery` folder after the first upload.

## Auto-Optimizations Applied

The backend (`config/multer.js`) applies these Cloudinary transformations automatically:

| Setting          | Value                       |
|------------------|-----------------------------|
| Quality          | `auto:best`                 |
| Format           | `auto` (WebP where supported)|
| Max width        | 2400px (preserves aspect)   |
| Folder           | `ravi-gallery`              |
| Allowed formats  | jpg, jpeg, png, webp, gif, avif |

Thumbnails are generated on-the-fly via Cloudinary URL transformations (no extra storage cost):
- Width: 400px, Height: 400px, Crop: fill, Quality: auto

## Free Tier Limits

| Resource          | Free Limit              |
|-------------------|-------------------------|
| Storage           | 25 GB                   |
| Bandwidth         | 25 GB/month             |
| Transformations   | 25,000/month            |
| Images/videos     | Unlimited files         |

25 GB stores approximately 12,500+ full-resolution photos at ~2MB each.

## Deleting Images

When a photo is deleted via `DELETE /api/images/:id`, the backend calls:

```javascript
cloudinary.uploader.destroy(cloudinaryId)
```

This removes the image from Cloudinary storage automatically.

## Security Notes

- **Never expose** your `CLOUDINARY_API_SECRET` in frontend code
- All uploads go through your backend → Cloudinary (not directly from browser)
- The API secret is only used server-side
