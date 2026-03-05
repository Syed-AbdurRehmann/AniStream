# 🎬 AniStream

A full-stack streaming web app for movies and TV shows, built with **React + Vite** on the frontend and **Node.js + Express** on the backend.

---

## ✨ Features

- 🏠 **Home Page** — Auto-rotating featured hero banner, trending (daily/weekly), now playing, popular, top rated, and airing today rows
- 🎥 **Watch Page** — Embedded video player with multiple stream providers, season/episode navigation, and auto-play
- 🔒 **Authentication** — Register, login, and Google OAuth with JWT-based sessions
- 📋 **Watch History** — Automatically tracks what you've watched
- 👤 **User Profile** — Manage your account details
- 🔍 **Search & Catalog** — Browse and search movies and TV shows
- 🛡️ **Ad Blocker** — Built-in ad blocker component for the player
- 📱 **Responsive Design** — Mobile-friendly layout throughout
- ⚡ **Rate Limiting & Security** — Helmet, CORS, and express-rate-limit on the API

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Swiper |
| Backend | Node.js, Express 4, better-sqlite3 |
| Auth | JWT, bcryptjs, Google OAuth (`google-auth-library`) |
| Data | TMDB API, custom stream scrapers (cheerio, node-fetch) |
| Testing | Playwright |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- A [TMDB API key](https://www.themoviedb.org/settings/api)

### 1. Clone the repo

```bash
git clone https://github.com/Syed-AbdurRehmann/AniStream.git
cd AniStream
```

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Configure environment variables

Create a `.env` file in the **`server/`** folder:

```env
PORT=3001
JWT_SECRET=your_super_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
NODE_ENV=development
```

Create a `.env` file in the **root** folder:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Run the app

Open two terminals:

```bash
# Terminal 1 – Backend
cd server
npm run dev

# Terminal 2 – Frontend
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 📁 Project Structure

```
AniStream/
├── index.html
├── vite.config.js
├── src/
│   ├── App.jsx
│   ├── api/          # TMDB, auth, scraper API clients
│   ├── components/   # Navbar, Footer, MediaCard, MediaRow, etc.
│   ├── context/      # AuthContext (JWT + Google OAuth)
│   ├── pages/        # Home, Watch, Details, Catalog, Search, History, Profile, Auth
│   └── utils/        # Local storage helpers
├── server/
│   ├── server.js     # Express app entry point
│   ├── db.js         # SQLite database setup
│   ├── routes/       # auth.js, user.js
│   ├── middleware/   # auth.js (JWT verification)
│   └── scrapers/     # Stream URL scraper
└── tests/
    └── e2e.spec.js   # Playwright end-to-end tests
```

---

## 🧪 Running Tests

```bash
npx playwright test
```

---

## 📝 License

This project is for personal/educational use only. Streaming content is sourced from third-party embeds — use responsibly.
