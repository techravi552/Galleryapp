# Environment Variables Guide

## Overview

All configuration is done through environment variables.
Never commit `.env` to version control.

---

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

---

## Variables Reference

### Server

| Variable    | Required | Default       | Description                    |
|-------------|----------|---------------|--------------------------------|
| `PORT`      | No       | `5000`        | TCP port the server listens on |
| `NODE_ENV`  | No       | `development` | `development` or `production`  |

**Development:**
```env
PORT=5000
NODE_ENV=development
```

**Production:**
```env
PORT=5000
NODE_ENV=production
```

---

### MongoDB

| Variable       | Required | Description                                 |
|----------------|----------|---------------------------------------------|
| `MONGODB_URI`  | **Yes**  | Full MongoDB Atlas connection string         |

**Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Example:**
```env
MONGODB_URI=mongodb+srv://ravi_user:MySecurePass123@cluster0.abc12.mongodb.net/ravi_gallery?retryWrites=true&w=majority
```

> The database name `ravi_gallery` is created automatically on first insert.

---

### Cloudinary

| Variable                  | Required | Description              |
|---------------------------|----------|--------------------------|
| `CLOUDINARY_CLOUD_NAME`   | **Yes**  | Your cloud name          |
| `CLOUDINARY_API_KEY`      | **Yes**  | Your API key             |
| `CLOUDINARY_API_SECRET`   | **Yes**  | Your API secret          |

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dq7xm1abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz1234
```

Find these on: https://cloudinary.com/console

---

### CORS

| Variable          | Required | Default                         | Description                    |
|-------------------|----------|---------------------------------|--------------------------------|
| `ALLOWED_ORIGINS` | No       | localhost:3000, localhost:5500  | Comma-separated allowed origins |

**Development:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500
```

**Production:**
```env
ALLOWED_ORIGINS=https://ravi-gallery.onrender.com,https://gallery.yourdomain.com
```

---

### Rate Limiting

| Variable               | Required | Default   | Description                          |
|------------------------|----------|-----------|--------------------------------------|
| `RATE_LIMIT_WINDOW_MS` | No       | `900000`  | Window in ms (900000 = 15 minutes)   |
| `RATE_LIMIT_MAX`       | No       | `100`     | Max requests per IP per window       |

**Example:**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Additional limiters (hardcoded):
- Upload: 30 requests per hour per IP
- Comments: 30 requests per 15 minutes per IP

---

## Full .env Example

```env
# ─── Server ────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── MongoDB Atlas ─────────────────────────
MONGODB_URI=mongodb+srv://ravi_user:MyPass@cluster0.abc12.mongodb.net/ravi_gallery?retryWrites=true&w=majority

# ─── Cloudinary ────────────────────────────
CLOUDINARY_CLOUD_NAME=dq7xm1abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz1234

# ─── CORS ──────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500

# ─── Rate Limiting ─────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `CLOUDINARY_API_SECRET` is never in frontend code
- [ ] `MONGODB_URI` password uses special characters (URL-encode them if needed)
- [ ] `NODE_ENV=production` in production deployment
- [ ] `ALLOWED_ORIGINS` is restricted to your actual domains in production

---

## URL-Encoding Passwords

If your MongoDB password contains special characters (`@`, `#`, `%`, etc.), URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@`       | `%40`   |
| `#`       | `%23`   |
| `%`       | `%25`   |
| `!`       | `%21`   |
| `$`       | `%24`   |

Example: password `pass@word#1` becomes `pass%40word%231` in the URI.
