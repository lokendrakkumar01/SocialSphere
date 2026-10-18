# SocialSphere 🌐

> **A modern, scalable social networking platform engineered using REA (Reverse Engineer Anything) principles and modern progressive web architecture.**

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Overview & Key Capabilities

**SocialSphere** is a production-oriented, full-stack social networking platform built with high performance, real-time interactivity, and enterprise security in mind. Inspired by reverse-engineered findings from top-tier platforms (Threads, Bluesky, Instagram, X), SocialSphere avoids static frontend mockups in favor of **real, functioning end-to-end features**.

### ✨ Highlights

- 🔐 **Zero-Trust Authentication & Account Security**:
  - Secure password hashing using `bcrypt` (12 rounds)
  - Split-token authentication: Short-lived access tokens (JWT) paired with revocable, rotatable refresh tokens
  - Role-based authorization (`user`, `moderator`, `admin`)
  - Real-time username availability checks during onboarding
  - Account privacy (Public vs. Private profiles with follow approval workflows)
  - Data portability: one-click full account data export in standard JSON
- 📰 **Algorithmic & Chronological Social Feeds**:
  - Dual-mode tabs: **For You** (discovery ranking by recency and engagement) & **Following** (chronological stream)
  - Rich text posts with auto-parsed hashtags (`#tag`) and mentions (`@username`)
  - Image, video, and multi-media uploads with preview and size enforcement
  - Optimistic likes, bookmarks/saved collections, and reposts with attribution
  - Threaded nested comment replies with cascading deletion
- 💬 **Real-Time Duplex Direct Messaging (Socket.IO)**:
  - Sub-second 1-on-1 private messaging
  - Live typing indicators with auto-clear debounce
  - Message read receipts and dynamic unread badge counts
  - Real-time online/offline presence tracking
  - Photo attachment sharing in chats
- 📸 **Ephemeral Stories (24-Hour Expiration)**:
  - Top story rail with animated gradient rings for unviewed stories
  - Fullscreen Instagram-style story viewer with timed progress bars (5 seconds per story)
  - Tap-to-pause and tap-to-advance navigation
  - Direct message reply shortcut right from the story player
- 🎥 **Reels & Short-Form Video Feed**:
  - Vertical TikTok/Reels feed optimized for mobile and desktop
  - Audio mute/unmute toggles, continuous playback, overlay like & comment drawers
- 🔍 **Search & Discovery Engine**:
  - Debounced universal search across users, posts, and hashtags
  - Trending topics aggregation (calculated dynamically from recent engagement)
  - Smart creator suggestions based on social graph connections
- 🛡️ **Protected Admin & Moderation Console**:
  - Platform-wide live metrics: total users, active accounts, weekly post velocity, pending reports
  - User management table with one-click account suspension and restoration
  - Moderation queue: review user-submitted reports with dismiss and enforce actions
  - Immutable audit trail recording administrative events

---

## 🏗️ Architecture & Technology Stack

```
socal  platform/
├── docs/
│   ├── rea-investigation.md        # REA analysis & reference platform findings
│   ├── architecture-spec.md        # Complete system architecture & data schemas
│   └── api-reference.md            # Detailed REST API endpoints catalog
├── server/                         # Express + TypeScript + Socket.IO + Mongoose
│   ├── src/
│   │   ├── config/                 # Typed env, DB connection (with auto in-memory fallback)
│   │   ├── controllers/            # Auth, User, Post, Comment, Message, Story, Admin
│   │   ├── middleware/             # JWT auth, Zod validation, Multer upload, Rate limiting
│   │   ├── models/                 # 12 Mongoose models with indexes and virtuals
│   │   ├── routes/                 # Express route handlers mounted at /api/v1
│   │   ├── services/               # Socket.IO service & Notification service
│   │   ├── seeds/                  # Rich fictional demo seed script
│   │   └── tests/                  # Vitest unit & integration test suite
│   ├── package.json
│   └── tsconfig.json
├── client/                         # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── api/                    # Axios client with auto token refresh interceptor
│   │   ├── components/             # Reusable UI primitives, Feed, Stories, Reels, Chat, Admin
│   │   ├── context/                # AuthContext, SocketContext, ThemeContext
│   │   ├── pages/                  # Home, Explore, Reels, Messages, Profile, Settings, Admin
│   │   └── App.tsx                 # Protected and role-based client routing
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml              # Multi-container orchestration
├── Dockerfile.server               # Backend Dockerfile
└── Dockerfile.client               # Frontend Dockerfile
```

---

## ⚡ Quick Start (Run Locally in 2 Minutes)

SocialSphere includes an **automatic in-memory database fallback**: if a local MongoDB instance is not detected, it will gracefully boot an embedded in-memory MongoDB server. You do not need to install MongoDB to test and evaluate the entire application!

### Step 1: Install Dependencies & Run Database Seed

1. **Install Server Dependencies & Seed Demo Data**:
   ```bash
   cd server
   npm install
   npm run seed
   ```

   *Seed Output will populate 5 rich creator and admin accounts with posts, stories, chats, and comments.*

2. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

---

### Step 2: Start the Servers

1. **Start Backend API & Socket Server** (Port 5000):
   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend Development Server** (Port 5173):
   ```bash
   cd client
   npm run dev
   ```

3. Open **`http://localhost:5173`** in your browser.

---

## 🔑 Fictional Demonstration Accounts

All demo accounts use the standard evaluation password: **`password123`**.  
The login page includes **1-click quick fill buttons** for immediate sign-in!

| Role | Username | Email | Key Features to Test |
|---|---|---|---|
| **Platform Admin** | `admin` | `admin@socialsphere.app` | Access to `/admin` Console, Metrics, Moderation Queue, Audit Logs |
| **Moderator** | `elena_design` | `elena@example.com` | Moderation rights, delete posts, design token discussions |
| **Tech Creator** | `alex_tech` | `alex@example.com` | Verified badge, launch post, direct chat with Sarah |
| **Travel Creator** | `sarah_travel` | `sarah@example.com` | Active 24h stories, photo posts, travel comments |
| **Fitness Creator**| `marcus_fit` | `marcus@example.com` | Health posts, reports queue interaction |

---

## 🧪 Testing and Quality Assurance

Run the automated test suite in `server`:

```bash
cd server
npm test
```

Test coverage includes:
- Secure password hashing and comparison with `bcrypt` (12 rounds)
- JWT access token generation, signing, and verification
- User registration and validation error handling
- Duplicate username and email constraint enforcement
- Post creation, hashtag extraction, and feed retrieval
- Like and unlike toggles with count integrity
- Comment and reply thread creation

---

## 🐳 Docker Deployment

To spin up the entire production stack (MongoDB, Node.js API, Nginx Client):

```bash
docker-compose up --build
```

- Client: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 🔒 Security Best Practices Implemented

1. **Password Storage**: Passwords are encrypted using salted bcrypt with 12 rounds. Plaintext passwords are never logged, stored, or returned in API responses.
2. **Access Token Lifespan**: JWT access tokens expire in 15 minutes. Refresh tokens are stored in the database and invalidated upon logout.
3. **HTTP Headers**: Enforced via `helmet` (Strict-Transport-Security, X-Frame-Options, Cross-Origin-Resource-Policy).
4. **Rate Limiting**: `express-rate-limit` prevents brute-force attempts on authentication and post creation.
5. **NoSQL Injection**: Parameterized Mongoose queries with strict typing and schema validation.
6. **Input Sanitation**: Zod schema validation on all request bodies and query parameters.
7. **Role Verification**: Server-side validation of roles on every administrative endpoint.

---

## 📄 License

SocialSphere is open-source software licensed under the [MIT License](LICENSE).
