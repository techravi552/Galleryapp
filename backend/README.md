# Ravi Gallery

A production-ready, mobile-first image gallery platform built with Node.js, Express, MongoDB Atlas, and Cloudinary.

## Features

**Frontend**
- Dark Glassmorphism UI with premium typography (Cormorant Garamond + DM Sans)
- Mobile-first responsive design — works on all devices
- Masonry grid layout with infinite scroll
- Lazy loading with skeleton placeholders
- Fullscreen lightbox with swipe navigation + double-tap zoom
- Like, comment, download, and share images
- Search by title/tag, sort by newest/popular/oldest, filter by tag
- PWA — installable, works offline, service worker caching
- Light/Dark theme toggle (persisted)
- Smooth animations throughout

**Backend**
- RESTful API with Express.js
- MongoDB Atlas via Mongoose with full text search
- Cloudinary image upload and auto-optimization
- Helmet, CORS, compression, rate limiting, input sanitization
- Graceful error handling and request validation

---

## Tech Stack

| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript                         |
| Backend  | Node.js 18+, Express.js 4                               |
| Database | MongoDB Atlas, Mongoose 8                               |
| Storage  | Cloudinary (images)                                     |
| Security | Helmet, express-rate-limit, express-mongo-sanitize, CORS|

---

## Project Structure

```
ravi-gallery/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js       # Cloudinary SDK setup
│   │   ├── database.js         # MongoDB connection
│   │   └── multer.js           # Multer + Cloudinary storage
│   ├── controllers/
│   │   ├── imageController.js  # Image CRUD logic
│   │   └── profileController.js
│   ├── middleware/
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── notFound.js         # 404 handler
│   │   ├── rateLimiter.js      # Rate limiting
│   │   └── validateRequest.js  # express-validator
│   ├── models/
│   │   ├── Image.js            # Image schema
│   │   └── Profile.js          # Singleton profile schema
│   ├── routes/
│   │   ├── imageRoutes.js
│   │   └── profileRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Express app entry point
└── frontend/
    ├── css/
    │   └── main.css            # Full design system
    ├── icons/                  # PWA icons (all sizes)
    ├── js/
    │   ├── api.js              # API client module
    │   ├── app.js              # Page router / init
    │   ├── gallery.js          # Masonry + infinite scroll
    │   ├── lightbox.js         # Fullscreen viewer + comments/delete
    │   ├── profile.js          # Profile load/edit/avatar
    │   ├── pwa.js              # SW registration + install prompt
    │   ├── ui.js               # Toast, theme, nav, card builder
    │   └── upload.js           # Upload form + drag-drop + progress
    ├── gallery.html
    ├── index.html
    ├── manifest.json           # PWA manifest
    ├── profile.html
    ├── service-worker.js       # Offline caching
    └── upload.html
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/ravi-gallery.git
cd ravi-gallery/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#environment-variables)).

### 3. Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:5000`. The frontend is served statically from `../frontend`.

### 4. Open in Browser

Navigate to `http://localhost:5000`.

---

## API Reference

### Images

| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/api/images`                | List images (paginated)  |
| GET    | `/api/images/:id`            | Get single image         |
| POST   | `/api/images/upload`         | Upload new image         |
| PUT    | `/api/images/like/:id`       | Increment like count     |
| POST   | `/api/images/comment/:id`    | Add comment              |
| PUT    | `/api/images/download/:id`   | Record download          |
| DELETE | `/api/images/:id`            | Delete image             |

**Query Parameters for GET `/api/images`:**

| Param  | Type   | Default  | Values                  |
|--------|--------|----------|-------------------------|
| page   | number | 1        | ≥1                      |
| limit  | number | 12       | 1–50                    |
| sort   | string | newest   | newest, oldest, popular |
| search | string | —        | text search query       |
| tag    | string | —        | tag filter              |

**Upload Request:**
- Method: `POST /api/images/upload`
- Content-Type: `multipart/form-data`
- Fields: `image` (file, required), `title` (string), `description` (string), `tags` (comma-separated string)

### Profile

| Method | Endpoint      | Description         |
|--------|---------------|---------------------|
| GET    | `/api/profile`| Get gallery profile |
| PUT    | `/api/profile`| Update profile      |

### Health

| Method | Endpoint      | Description  |
|--------|---------------|--------------|
| GET    | `/api/health` | Health check |

---

## Environment Variables

| Variable                | Required | Description                                  |
|-------------------------|----------|----------------------------------------------|
| `PORT`                  | No       | Server port (default: 5000)                  |
| `NODE_ENV`              | No       | `development` or `production`                |
| `MONGODB_URI`           | **Yes**  | MongoDB Atlas connection string              |
| `CLOUDINARY_CLOUD_NAME` | **Yes**  | Cloudinary cloud name                        |
| `CLOUDINARY_API_KEY`    | **Yes**  | Cloudinary API key                           |
| `CLOUDINARY_API_SECRET` | **Yes**  | Cloudinary API secret                        |
| `ALLOWED_ORIGINS`       | No       | Comma-separated CORS origins                 |
| `RATE_LIMIT_WINDOW_MS`  | No       | Rate limit window in ms (default: 900000)    |
| `RATE_LIMIT_MAX`        | No       | Max requests per window (default: 100)       |

---

## Deployment

See `docs/deployment-guide.md` for full Render deployment instructions.

---

## License

MIT
