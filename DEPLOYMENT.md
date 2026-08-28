# PeerHub Deployment Guide (Render, Vercel, Netlify)

This project is built to deploy effortlessly across all modern cloud platforms.

---

## 🚀 Option 1: Separate Deployments (Recommended)

### Backend: Deploy to **Render** / **Railway**
1. **Root Directory**: `server` (or repository root with start command `node server/server.js`)
2. **Build Command**: `npm install`
3. **Start Command**: `node server.js`
4. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://<db_username>:<password>@peer-project.m1mt4l8.mongodb.net/?appName=peer-project
   CLIENT_URL=https://your-frontend.vercel.app
   FIREBASE_PROJECT_ID=peer-hub-41362
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@peer-hub-41362.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
   ```


---

### Frontend: Deploy to **Vercel** or **Netlify**
1. **Root Directory**: `client`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**:
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   VITE_FIREBASE_PROJECT_ID=peer-hub-41362
   VITE_FIREBASE_AUTH_DOMAIN=peer-hub-41362.firebaseapp.com
   VITE_FIREBASE_STORAGE_BUCKET=peer-hub-41362.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=116363276703389577288
   ```

*(Note: SPA redirects for direct links like `/teacher/dashboard` or `/project/123` are already preconfigured via `client/public/_redirects` and `client/vercel.json`)*.

---

## 📦 Option 2: Fullstack Monolith (Single Service on Render)
1. **Build Command**: `npm run build:all`
2. **Start Command**: `npm start`
3. The server will automatically serve both `/api/*` endpoints and the client React SPA from `client/dist`.
