# MongoDB Atlas Setup Guide

## Step 1 — Create Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click **Try Free** → sign up with Google or email
3. Choose **Free (M0)** tier → click **Create**

## Step 2 — Create a Cluster

1. Select cloud provider: **AWS** (recommended)
2. Select region closest to your users (e.g., `ap-south-1` for India)
3. Cluster name: `Cluster0` (default is fine)
4. Click **Create Cluster** (takes 1–3 minutes)

## Step 3 — Create Database User

1. Left sidebar → **Database Access**
2. Click **Add New Database User**
3. Authentication method: **Password**
4. Username: e.g., `ravi_user`
5. Password: click **Autogenerate Secure Password** → **Copy** it
6. Database User Privileges: **Atlas admin** (or Read/Write to any database)
7. Click **Add User**

## Step 4 — Whitelist IP Address

1. Left sidebar → **Network Access**
2. Click **Add IP Address**
3. For development: click **Add Current IP Address**
4. For production (Render): click **Allow Access from Anywhere** → `0.0.0.0/0`

   > **Note:** For production, Render uses dynamic IPs. You must allow all IPs (`0.0.0.0/0`) or use Render's static outbound IPs if on a paid plan.

5. Click **Confirm**

## Step 5 — Get Connection String

1. Left sidebar → **Database** → click **Connect** on your cluster
2. Choose **Connect your application**
3. Driver: **Node.js** | Version: **5.5 or later**
4. Copy the connection string. It looks like:

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. Replace `<username>` and `<password>` with your credentials
6. Add your database name before the `?`:

   ```
   mongodb+srv://ravi_user:YourPassword@cluster0.xxxxx.mongodb.net/ravi_gallery?retryWrites=true&w=majority
   ```

## Step 6 — Set in .env

```env
MONGODB_URI=mongodb+srv://ravi_user:YourPassword@cluster0.xxxxx.mongodb.net/ravi_gallery?retryWrites=true&w=majority
```

## Step 7 — Verify Connection

Start your server:
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
```

## Collections Created Automatically

Mongoose creates these collections on first use:
- `images` — photo documents
- `profiles` — the singleton gallery profile

## Indexes

The `Image` model creates these indexes automatically:
- `createdAt: -1` — for newest-first pagination
- `likes: -1` — for popular sort
- `tags: 1` — for tag filtering
- Text index on `title`, `description`, `tags` — for search

## Free Tier Limits (M0)

| Resource | Limit         |
|----------|---------------|
| Storage  | 512 MB        |
| RAM      | 512 MB shared |
| Connections | 500 max   |
| Data transfer | 10 GB/week |

512 MB stores approximately 50,000–100,000 image documents (metadata only; actual images are on Cloudinary).
