# Deployment Guide — In Progress

## Architecture Overview

```
[Vercel / Netlify / Static Host] ─── Frontend (React SPA)
         │
         │  HTTPS API requests
         ▼
[Render / Railway]             ─── Backend (Node / Express API, port 5002)
         │
         │  Mongoose connection
         ▼
[MongoDB Atlas]                ─── Cloud Database (Replica Set)
```

---

## 1. Required Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Port for Express server | `5002` (or set by platform `$PORT`) |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/in_progress?retryWrites=true&w=majority` |
| `CLIENT_ORIGIN` | Allowed CORS origins (comma-separated if multiple) | `https://your-app.vercel.app,http://localhost:5173` |

### Frontend (`.env.production` or platform environment variables)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Full URL to the deployed backend API | `https://in-progress-api.onrender.com/api` |

*(If omitted in development, Vite proxies `/api` to `http://localhost:5002` via `vite.config.js`)*

---

## 2. MongoDB Atlas Setup Requirements

1. **Create an Atlas Account & Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. **Create a Database User**:
   - Navigate to **Database Access** -> **Add New Database User**.
   - Select **Password** authentication.
   - Assign the **Read and write to any database** built-in role.
   - Save your username and password securely (avoid special characters like `@`, `:`, `/` in passwords or URL-encode them).
3. **Network Access / IP Whitelist**:
   - Navigate to **Network Access** -> **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) since cloud hosts (Render/Railway/Vercel) use dynamic IPs.
4. **Retrieve Connection String**:
   - Click **Connect** on your cluster -> **Drivers** -> Driver: **Node.js** (version 5.5 or later).
   - Copy the URI: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
   - Append database name before the query string: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/in_progress?retryWrites=true&w=majority`

---

## 3. Backend Deployment Steps (e.g. Render / Railway)

### Deploying to Render:
1. Push your repository to GitHub / GitLab.
2. Log into [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Connect your repository.
4. Set the following settings:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: your MongoDB Atlas connection string
   - `CLIENT_ORIGIN`: `https://<your-frontend-domain>.vercel.app`
6. Click **Deploy Web Service**.
7. Note down your backend URL (e.g., `https://in-progress-backend.onrender.com`).

---

## 4. Frontend Deployment Steps (e.g. Vercel)

### Deploying to Vercel:
1. Log into [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
2. Import your repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (repository root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://<your-backend-domain>.onrender.com/api`
5. Click **Deploy**.
6. Once deployed, copy your production frontend URL (e.g., `https://in-progress-app.vercel.app`).
7. Update the backend `CLIENT_ORIGIN` variable on Render to include this exact frontend URL.

---

## 5. Frontend API URL Configuration

The frontend adapter detects the API location in `src/storage/http-api.adapter.js`:
- In production, set `VITE_API_BASE_URL=https://<your-backend-host>/api` in your hosting platform.
- In local development, leaving it unset defaults to `/api`, which Vite automatically proxies to `http://localhost:5002`.

---

## 6. CORS Configuration for Production

In `server/src/server.js`, CORS is configured to read `CLIENT_ORIGIN`:
- When hosting frontend on `https://my-journal.vercel.app`, set:
  ```env
  CLIENT_ORIGIN=https://my-journal.vercel.app
  ```
- If testing locally alongside production:
  ```env
  CLIENT_ORIGIN=https://my-journal.vercel.app,http://localhost:5173
  ```

---

## 7. Build and Start Commands

### Root / Frontend:
- **Install dependencies**: `npm install`
- **Development dev server**: `npm run dev`
- **Production build**: `npm run build`
- **Preview production build**: `npm run preview`

### Backend (`server/` directory):
- **Install dependencies**: `npm install`
- **Development with auto-reload**: `npm run dev`
- **Start production server**: `npm start`
- **Run tests**: `npm test`

---

## 8. Health-Check URL

- **Endpoint**: `GET /api/health`
- **Full URL**: `https://<backend-host>/api/health`
- **Expected Status**: `200 OK`
- **Expected Payload**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-29T11:00:00.000Z",
    "database": {
      "connected": true,
      "state": "connected"
    }
  }
  ```

---

## 9. How to Verify the Deployed Application

1. **Verify Health**:
   - Send a `GET` request to `https://<backend-host>/api/health`.
   - Ensure `"database": { "connected": true }`.
2. **Open Frontend**:
   - Visit `https://<frontend-host>`.
   - Verify page loads cleanly with no console errors or blank screens.
3. **Verify Views**:
   - Switch between **Today**, **Timeline**, **Entries**, and **Search**.
   - Verify **Entries** renders the archive list view while **Timeline** renders the chronological milestone view.
4. **Test Create / Save**:
   - Click **New Reflection**.
   - Enter title and notes in What Happened / What I Learned.
   - Click **Save Entry** — check that the "Saving..." state appears and transitions smoothly to the detail view.
5. **Test Image Upload & Clean-up**:
   - Attach a screenshot or image in the editor.
   - Save and inspect that the image renders in the detail view.
   - Navigate away to verify no memory leaks or broken images.
6. **Test Search**:
   - Search for a word from your created entry.
   - Verify matching entries appear quickly with the search badge and snippet.
7. **Test Deletion**:
   - Click the delete button on an entry, confirm the modal ("Deleting..."), and verify it is removed from Timeline and Entries.

---

## 10. Common Deployment Errors and Fixes

| Issue / Error | Cause | Fix |
| :--- | :--- | :--- |
| `Database is currently offline. Please verify MONGODB_URI.` | `MONGODB_URI` environment variable is missing, incorrect, or empty in backend environment. | In host dashboard (Render/Railway), add `MONGODB_URI` with your full Atlas connection string including username, password, and DB name. |
| `MongooseServerSelectionError: connection timed out` | MongoDB Atlas Network Access has not allowed connections from the backend host IP. | In MongoDB Atlas -> Network Access, add `0.0.0.0/0` (allow access from anywhere). |
| `CORS Error: No 'Access-Control-Allow-Origin' header` | `CLIENT_ORIGIN` in backend does not include the exact frontend protocol and domain. | Add `https://<your-vercel-domain>.vercel.app` (without trailing slash) to `CLIENT_ORIGIN` on the backend. |
| Search returns 500 or regex errors | User query contained unescaped regex characters. | Already resolved by `escapeRegex()` in `entry.service.js`. |
| Blank white screen on client crash | Unhandled React render error. | Already resolved by global `ErrorBoundary` in `main.jsx`. Shows recovery UI with "Try reloading" button. |
| Frontend 404s on page refresh | Static host does not route all requests to `index.html`. | For Vercel, ensure standard Vite build is used (handled automatically by `vercel.json` or Vite preset). |
