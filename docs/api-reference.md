# SocialSphere REST API Documentation

Base URL: `http://localhost:5000/api/v1`

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
Creates a new account and returns initial auth tokens.
- **Request Body**:
  ```json
  {
    "username": "alex_tech",
    "email": "alex@example.com",
    "displayName": "Alex Chen",
    "password": "password123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "data": {
      "user": {
        "_id": "60d0fe4f5311236168a109ca",
        "username": "alex_tech",
        "displayName": "Alex Chen",
        "email": "alex@example.com",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=alex_tech",
        "role": "user",
        "status": "active"
      },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  ```

### `POST /auth/login`
Authenticates via username or email and password.
- **Request Body**:
  ```json
  {
    "login": "alex_tech",
    "password": "password123"
  }
  ```
- **Response (200 OK)**: Returns user and token pair.

### `POST /auth/refresh`
Rotates refresh token and issues a new access token.
- **Request Body**: `{ "refreshToken": "<token>" }`

### `POST /auth/logout`
Revokes active refresh token.

### `GET /auth/me`
Requires `Authorization: Bearer <accessToken>`.
- Returns authenticated user profile.

### `GET /auth/check-username?username=<name>`
- Returns `{ "success": true, "available": true, "username": "name" }`.

---

## 2. Posts & Social Feed (`/posts`)

### `GET /posts/feed?type=for-you|following&page=1&limit=15`
- Returns paginated feed with author details, media, like/saved state, and engagement counts.

### `GET /posts/explore`
- Returns public posts sorted by popularity, likes count, and recency.

### `POST /posts`
- Creates a new post.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "content": "Exploring the Dolomites today! #travel #italy",
    "media": [
      {
        "url": "/uploads/1730000000-photo.jpg",
        "type": "image"
      }
    ],
    "visibility": "public"
  }
  ```

### `GET /posts/:id`
- Returns post by ID.

### `PATCH /posts/:id`
- Edits post content (author only).

### `DELETE /posts/:id`
- Soft-deletes post (author or moderator/admin).

### `POST /posts/:id/like`
- Toggles like on post. Returns updated `{ isLiked: boolean, likesCount: number }`.

### `POST /posts/:id/bookmark`
- Toggles save/bookmark on post.

---

## 3. Comments (`/comments`)

### `GET /comments/post/:postId`
- Returns threaded comments and replies for the specified post.

### `POST /comments/post/:postId`
- Creates a new comment or reply.
- **Request Body**:
  ```json
  {
    "content": "Incredible lighting on this shot!",
    "parentComment": "optional_comment_id_for_threaded_reply"
  }
  ```

### `DELETE /comments/:commentId`
- Deletes comment (author, post owner, or moderator).

### `POST /comments/:commentId/like`
- Toggles like on comment.

---

## 4. User Profiles & Social Graph (`/users`)

### `GET /users/profile/:username`
- Returns profile with follower count, following count, mutual follow status, and bio.

### `PATCH /users/profile`
- Updates authenticated user profile:
  ```json
  {
    "displayName": "Alex C.",
    "bio": "Building scalable open web apps ⚡",
    "website": "https://alexchen.dev",
    "avatar": "https://...",
    "coverPhoto": "https://...",
    "isPrivate": false
  }
  ```

### `POST /users/:targetId/follow`
- Follows user (or sends follow request if account is private).

### `POST /users/:targetId/unfollow`
- Unfollows user.

### `GET /users/:targetId/followers`
- Returns paginated list of followers.

### `GET /users/:targetId/following`
- Returns paginated list of accounts followed.

### `GET /users/:targetId/posts`
- Returns user's posts.

### `GET /users/saved`
- Returns authenticated user's saved/bookmarked posts.

### `POST /users/:targetId/block` & `POST /users/:targetId/unblock`
- Blocks/unblocks target user.

### `GET /users/data/export`
- Exports user data archive in JSON format.

---

## 5. Direct Messaging (`/messages`)

### `GET /messages/conversations`
- Returns user conversations with last message, unread badge, and recipient status.

### `POST /messages/conversations`
- Finds or initializes 1-on-1 conversation: `{ "participantId": "<userId>" }`.

### `GET /messages/conversations/:id/messages?page=1&limit=30`
- Returns chronological message history.

### `POST /messages/conversations/:id/messages`
- Sends message:
  ```json
  {
    "content": "Hey Sarah, check out this photo!",
    "media": { "url": "/uploads/photo.jpg", "type": "image" }
  }
  ```

### `POST /messages/conversations/:id/read`
- Marks all messages in conversation as read.

---

## 6. Ephemeral Stories (`/stories`)

### `GET /stories/feed`
- Returns active stories grouped by followed creators.

### `POST /stories`
- Publishes 24-hour ephemeral story:
  ```json
  {
    "mediaUrl": "/uploads/sunset.jpg",
    "mediaType": "image",
    "caption": "Sunset in Santorini"
  }
  ```

### `POST /stories/:id/view`
- Records story view.

---

## 7. Search & Discovery (`/search`)

### `GET /search?q=<term>`
- Returns matched users, posts, and hashtags.

### `GET /search/trending`
- Returns top trending hashtags in the past 7 days.

### `GET /search/suggested`
- Returns recommended creator accounts.

---

## 8. Notifications (`/notifications`)

### `GET /notifications`
- Returns notifications with sender details and linked post.

### `PATCH /notifications/read-all`
- Marks all notifications as read.

---

## 9. Admin & Moderation (`/admin`)
*Requires role: `admin` or `moderator`*

### `GET /admin/metrics`
- Returns telemetry: total users, active accounts, weekly growth, pending reports.

### `GET /admin/users?search=&role=&status=`
- Paginated user list with role and status filters.

### `PATCH /admin/users/:id/status`
- Modifies user status (`active`, `suspended`, `banned`) or role (`user`, `moderator`, `admin`).

### `GET /admin/reports?status=pending`
- Retrieves moderation review queue.

### `PATCH /admin/reports/:id`
- Resolves or dismisses report with notes.

### `GET /admin/audit-logs`
- Retrieves immutable administrative audit trail.
