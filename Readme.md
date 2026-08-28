# Peer Project Hub

> A modern developer community platform where engineers publish coding projects, discover high-quality work from peers, leave thoughtful feedback, bookmark favorites, rate projects, and build a visible portfolio.

## ✨ Features

### Core
- 🔐 Firebase Authentication (signup, login, logout, persistent sessions)
- 📁 Full CRUD for projects (create, read, update, delete)
- 🔒 Protected routes — ownership enforced on backend, never trusted from frontend
- 📄 Project details page with GitHub & live demo links

### Social & Discovery
- 💬 Comments (post, delete own)
- 🔍 Search by title, description, or tags
- 🏷️ Tag filtering
- ❤️ Like / Unlike (toggle, one like per user)
- 🔖 Bookmark / Unbookmark with dedicated Bookmarks page
- ⭐ 1–5 star ratings with average calculation
- 👤 Public user profile pages with edit for profile owner
- 📊 Analytics (total users, projects, comments, likes, spotlight cards)

### UX & Quality
- 📱 Fully responsive — mobile, tablet, desktop
- 💀 Skeleton loaders on project feed
- ✅ Empty states with helpful CTAs
- ⚠️ Error states with friendly messages
- 📄 Pagination (page/limit query params)
- 🎨 Micro-animations, smooth hover transitions
- ♿ Accessible semantic HTML, labels, focus states

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router v6, Axios, Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | Firebase Authentication + Firebase Admin SDK |
| Deployment | Vercel/Netlify (client) · Render (server) · MongoDB Atlas |

---

## 📁 Project Structure

```
peer-project-hub/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Route-level page components
│       ├── context/          # AuthContext
│       └── utils/            # firebase.js, api.js (Axios)
├── server/                   # Express backend
│   ├── config/               # db.js (MongoDB connection)
│   ├── controllers/          # Business logic
│   ├── middleware/           # authMiddleware, errorMiddleware
│   ├── models/               # Mongoose schemas
│   └── routes/               # Express routers
└── package.json              # Root scripts with concurrently
```

---

## ⚙️ Prerequisites

- Node.js v18+
- npm v9+
- A [Firebase project](https://console.firebase.google.com) with Email/Password auth enabled
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster

---

## 🔑 Environment Variables

### `server/.env` (copy from `server/.env.example`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/peer-project-hub
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> Get `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` from Firebase Console → Project Settings → Service Accounts → Generate new private key.

### `client/.env` (copy from `client/.env.example`)

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:5000
```

> Get these from Firebase Console → Project Settings → Your apps → Web app config.

---

## 🚀 Installation & Local Development

### 1. Clone the repo
```bash
git clone <repository-url>
cd peer-project-hub
```

### 2. Install all dependencies
```bash
# Root (concurrently)
npm install

# Client
cd client && npm install && cd ..

# Server
cd server && npm install && cd ..
```

### 3. Set up environment variables
```bash
# Server
cp server/.env.example server/.env
# → Fill in MONGO_URI and Firebase credentials

# Client
cp client/.env.example client/.env
# → Fill in Firebase web app config
```

### 4. Run in development
```bash
# From root — starts both client and server simultaneously
npm run dev

# Or individually:
npm run client   # starts Vite on http://localhost:5173
npm run server   # starts Express on http://localhost:5000
```

---

## 📡 API Endpoints

### Projects
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | Public | List projects (paginated, searchable) |
| GET | `/api/projects/:id` | Public | Get single project |
| POST | `/api/projects` | ✅ | Create project |
| PUT | `/api/projects/:id` | ✅ Owner | Update project |
| DELETE | `/api/projects/:id` | ✅ Owner | Delete project |
| GET | `/api/projects/bookmarks` | ✅ | Get current user's bookmarks |

### Interactions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/projects/:id/like` | ✅ | Toggle like |
| POST | `/api/projects/:id/bookmark` | ✅ | Toggle bookmark |
| POST | `/api/projects/:id/rating` | ✅ | Upsert rating (1–5) |

### Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/comments/:projectId` | Public | Get comments for a project |
| POST | `/api/comments` | ✅ | Post a comment |
| DELETE | `/api/comments/:id` | ✅ Owner | Delete own comment |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users/sync` | ✅ | Sync Firebase user to MongoDB |
| GET | `/api/users/:uid` | Public | Get user profile |
| PUT | `/api/users/:uid` | ✅ Owner | Update profile |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics` | Public | Platform-wide stats |

**Query params for `/api/projects`:**
- `page` (default: 1)
- `limit` (default: 9, max: 20)
- `search` — full-text search on title, description, tags
- `tag` — filter by tag
- `owner` — filter by owner firebaseUid

---

## 🚢 Deployment

### Frontend → Vercel / Netlify
1. Connect your repository to Vercel or Netlify
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/dist`
4. Add all `VITE_*` environment variables in the dashboard

### Backend → Render
1. Create a new Web Service on Render
2. Set root directory to `server/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all server environment variables, set `NODE_ENV=production`
6. Update `CLIENT_URL` to your deployed frontend URL

### MongoDB Atlas
1. Create a free M0 cluster
2. Add your server's IP to the IP allowlist (or use 0.0.0.0/0 for Render)
3. Create a database user
4. Copy the connection string to `MONGO_URI`

---

## 🧪 Testing Checklist

- [ ] Signup → user created in MongoDB
- [ ] Login → session persists on refresh
- [ ] Create project → appears in feed, newest first
- [ ] Edit/Delete → owner only, verified on backend
- [ ] Like/Unlike → toggles correctly, persists
- [ ] Bookmark → appears on /bookmarks page
- [ ] Rating → average recalculates on each vote
- [ ] Comment → post appears, owner can delete
- [ ] Search by title/tag → correct results
- [ ] Pagination → correct page/limit behavior
- [ ] Protected routes → redirect unauthenticated users
- [ ] Analytics → real numbers from DB
- [ ] 404 page → appears for unknown routes
- [ ] Mobile layout → no horizontal overflow

---

## 📄 License

MIT