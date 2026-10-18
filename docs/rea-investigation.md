# REA (Reverse Engineer Anything) Investigation & Reference Social Platform Analysis

**Project**: SocialSphere  
**Date**: October 2026  
**Investigator**: Lead Software Architect & Security Engineer  
**Target Repository**: `https://github.com/morluto/rea` (morluto/rea)  
**Reference Domain**: Modern Progressive Social Networking Architecture (Instagram, Threads, Bluesky, X / Twitter patterns)

---

## 1. REA Repository Inspection & Toolchain Analysis

### 1.1 Overview of REA
REA ("Reverse Engineer Anything", published under `morluto/rea` and `rea-agents` on npm) is an open-source reverse-engineering framework and Model Context Protocol (MCP) server designed to enable autonomous AI agents and engineers to inspect, trace, and understand:
- JavaScript and Electron applications (unpacked trees, ASAR archives, module bundles).
- Native binaries (ELF, Mach-O, PE) via disassembler integrations (Hopper, Ghidra, IDA).
- Network protocol schemas, runtime behavior, and web application mechanics.

### 1.2 Environment Compatibility Check
- **Node.js**: `v24.20.0` (compatible with REA's requirements for Node 22+ / 24+).
- **npm**: `11.19.0`.
- **Operating System**: Windows (AMD64).
- **Process Boundaries**: Procps and native bridge requirements apply when tracing native disassemblers; static JavaScript and AST analysis run locally without native disassembler binaries.

### 1.3 REA Architecture & Methodology
REA operates on an **Evidence-Based Reverse Engineering** model. It categorizes all discoveries into:
1. **Seen (Observed / Verified)**: Direct artifacts, exported APIs, documented schema definitions, network payloads, DOM hierarchies.
2. **Inferred (Deductions)**: Architectural assumptions derived from patterns (e.g., standard JWT refresh token rotation, fan-out-on-write feeds).
3. **Unknowns / Limitations**: Black-box server internals, proprietary proprietary algorithms (e.g., proprietary neural ranking weights), rate limits.

---

## 2. Reference Platform Architecture Reverse-Engineering

We investigated modern reference social platforms (following authorized public web client behavior across Threads, Bluesky AT Protocol, and modern feed engines).

### 2.1 Navigation & Information Architecture
*Observed Pattern*:
- **Desktop Layout**: Collapsible / fixed left sidebar (Brand logo, Home, Explore/Search, Reels/Shorts, Messages, Notifications, Create, Profile, More / Admin).
- **Mobile Layout**: Responsive top header (Brand, Direct Messages, Notifications) + fixed bottom navigation bar (Home, Explore, Create (+), Reels, Profile).
- **Central Feed**: Max width constraint (600px - 680px) for high readability, accompanied on desktop by a right sidebar for Trending Hashtags, Suggested Accounts to follow, and Platform Footer links.

### 2.2 Authentication & Account Recovery Flows
*Observed Pattern*:
- Split-token security: Short-lived Access Token (JWT, ~15m expiry) + Revocable Refresh Token (HTTP-only secure cookie or stored session token in DB).
- Credential validation: Client-side Zod validation coupled with server-side validation.
- Password hashing: Secure algorithms (Argon2id or bcrypt with salt rounds >= 10).
- Account states: Unverified, Verified, Suspended, Deactivated.

### 2.3 Social Feed & Engagement Mechanics
*Observed Pattern*:
- Post types: Text (with hashtag/mention parsing), single/multi-image carousel, video, external link preview.
- Interaction buttons: Like (optimistic UI update with debounce), Comment (modal or collapsible threaded replies), Repost / Share with attribution, Bookmark/Save.
- Feed Views: "For You" (Discovery / algorithmic ranking based on recency, engagement, and topic) vs "Following" (chronological stream of followed creators).

### 2.4 User Profiles & Social Graph
*Observed Pattern*:
- Profile Header: Avatar, cover photo, username (@handle), display name, bio, website link, joined date, follower/following counts.
- Profile Tabs: Posts, Media (images/videos), Likes (if public/authorized), Saved/Bookmarks (private to owner).
- Relationship states: Self, Following, Not Following, Follow Requested (private accounts), Blocked.

### 2.5 Real-Time Communication (Direct Messaging & Presence)
*Observed Pattern*:
- Socket.IO / WebSocket duplex channel:
  - Event `join_conversation`: Joins a room identified by conversation ID.
  - Event `send_message` / `receive_message`: Sub-second message delivery with optimistic client delivery.
  - Event `typing_start` / `typing_stop`: Ephemeral typing indicators with auto-timeout.
  - Event `message_read`: Real-time read receipt updating unread counter.
  - Presence: User connect/disconnect heartbeats updating active status.

### 2.6 Stories & Ephemeral Media
*Observed Pattern*:
- 24-hour Time-To-Live (TTL) ephemeral image and video items.
- Story reel bar at the top of the feed showing unviewed stories (gradient border) vs viewed stories (muted border).
- Fullscreen modal viewer with auto-advancing progress bars (5 seconds per item), pause on touch/mouse hold, and reply shortcut.

### 2.7 Administration & Moderation Architecture
*Observed Pattern*:
- Role-Based Access Control (RBAC): `user`, `moderator`, `admin`.
- Moderation Queue: Flagged posts and reported accounts with reason categorizations (spam, harassment, inappropriate content, copyright).
- Actions: Dismiss report, Hide post, Delete post, Suspend user, Ban user with audit trail logging.

---

## 3. Evidence, Unknowns, and Constraints

| Dimension | Observed Evidence | Inferred Logic | Unknown / Out-of-Scope |
|---|---|---|---|
| **Auth** | Bearer tokens, HTTP-only cookies, OAuth2 redirects | JWT signed with HMAC-SHA256, Refresh Token rotation | Proprietary risk engine / device fingerprinting |
| **Feed Ranking** | Recency, like count, comment velocity | Linear combination scoring: `Score = w1*Recency + w2*Likes + w3*Comments` | Multi-terabyte machine learning embeddings |
| **Real-time** | WebSocket protocol, Socket.IO handshake | Room-based pub/sub per user and conversation | Redis adapter cluster for multi-region scale |
| **Media** | Cloudinary / CDN signed upload endpoints | Multi-tier validation: MIME type inspection + byte-size limit | Transcoding pipelines (HLS/DASH chunking) |

---

## 4. Implementation Directives for SocialSphere

1. **Configurable Branding**: Brand name `SocialSphere` defined in configuration and UI constants.
2. **Clean Separation of Concerns**: Monorepo with dedicated `server` and `client` directories.
3. **Guaranteed Local Run**: Use in-memory or connection-pooling MongoDB architecture with fallback so anyone can boot the full system instantly.
4. **Zero-Trust Security**: Input validation at every layer using Zod, secure password hashing, strict authorization checks on every mutating route.
5. **Real Working Features**: No mocked fake UI or static placeholders—all buttons, feeds, chats, stories, likes, follows, and admin tools are fully wired to live endpoints and database records.
