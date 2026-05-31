# Render Deployment Guide

## Overview

Ravi Gallery is deployed as a single **Web Service** on Render.
The Express backend serves both the API and the static frontend files.

---

## Prerequisites

- GitHub account with the project pushed to a repository
- MongoDB Atlas cluster configured (see `mongodb-setup.md`)
- Cloudinary account configured (see `cloudinary-setup.md`)

---

## Step 1 — Push to GitHub

```bash
# From project root
git init
git add .
git commit -m "Initial commit: Ravi Gallery"
git branch -M main
git remote add origin https://github.com/yourusername/ravi-gallery.git
git push -u origin main
```

Create a `.gitignore` in `backend/`:

```gitignore
node_modules/
.env
*.log
```

---

## Step 2 — Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect your GitHub account if not already done
4. Select your `ravi-gallery` repository
5. Click **Connect**

---

## Step 3 — Configure Service Settings

| Setting              | Value                              |
|----------------------|------------------------------------|
| **Name**             | `ravi-gallery`                     |
| **Region**           | Singapore (or closest to you)      |
| **Branch**           | `main`                             |
| **Root Directory**   | `backend`                          |
| **Runtime**          | `Node`                             |
| **Build Command**    | `npm install`                      |
| **Start Command**    | `npm start`                        |
| **Instance Type**    | Free (or Starter for always-on)    |

---

## Step 4 — Set Environment Variables

In the Render dashboard → your service → **Environment** tab, add:

```
NODE_ENV              = production
PORT                  = 5000
MONGODB_URI           = mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/ravi_gallery?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY    = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
ALLOWED_ORIGINS       = https://ravi-gallery.onrender.com
RATE_LIMIT_WINDOW_MS  = 900000
RATE_LIMIT_MAX        = 100
```

Replace values with your actual credentials.

---

## Step 5 — Update MongoDB IP Whitelist

Since Render free tier uses dynamic IPs, allow all IPs in MongoDB Atlas:

1. MongoDB Atlas → **Network Access**
2. **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
3. Click **Confirm**

---

## Step 6 — Deploy

1. Click **Create Web Service** (or **Deploy** if already created)
2. Watch the build logs — should show:
   ```
   ✅ MongoDB Connected: cluster0.xxxx.mongodb.net
   🚀 Ravi Gallery Server running
      Port: 5000
   ```
3. Your app URL: `https://ravi-gallery.onrender.com`

---

## Step 7 — Update CORS

Once you have your Render URL, update `ALLOWED_ORIGINS`:

```
ALLOWED_ORIGINS = https://ravi-gallery.onrender.com
```

---

## Continuous Deployment

Render auto-deploys on every push to `main`:

```bash
git add .
git commit -m "Update: description"
git push origin main
# Render detects push and auto-deploys
```

---

## Custom Domain (Optional)

1. Render dashboard → your service → **Settings** → **Custom Domains**
2. Add your domain: `gallery.yourdomain.com`
3. Create a CNAME record pointing to your Render URL
4. Update `ALLOWED_ORIGINS` to include your custom domain

---

## Free Tier Notes

| Limitation              | Detail                                          |
|-------------------------|-------------------------------------------------|
| Spin-down               | Free services sleep after 15 min of inactivity |
| Cold start              | ~30 seconds on first request after sleep        |
| Build minutes           | 400 free build minutes/month                    |
| Bandwidth               | 100 GB/month                                    |

**Tip:** Upgrade to Render Starter ($7/month) for always-on service with no cold starts.

---

## Troubleshooting

**Build fails: `Cannot find module`**
→ Make sure `Root Directory` is set to `backend` in Render settings.

**MongoDB connection error**
→ Check `MONGODB_URI` is correct and MongoDB Atlas allows `0.0.0.0/0`.

**Images not loading**
→ Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are set correctly.

**CORS errors in browser**
→ Update `ALLOWED_ORIGINS` to match your exact frontend URL (no trailing slash).

**404 on page refresh**
→ The Express server handles this with a wildcard route that serves `index.html`.
