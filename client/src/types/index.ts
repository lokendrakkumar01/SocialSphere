export type UserRole = 'user' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  coverPhoto?: string;
  bio?: string;
  website?: string;
  isPrivate: boolean;
  isVerified: boolean;
  role: UserRole;
  status: AccountStatus;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  blockedUsers?: string[];
  isFollowing?: boolean;
  isFollowRequested?: boolean;
  isBlocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface Post {
  _id: string;
  author: User;
  content: string;
  media: MediaItem[];
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  visibility: 'public' | 'followers' | 'private';
  originalPost?: Post;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: User;
  content: string;
  parentComment?: string | null;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface Story {
  _id: string;
  author: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewers: string[];
  expiresAt: string;
  createdAt: string;
  hasViewed?: boolean;
}

export interface StoryGroup {
  author: User;
  isSelf: boolean;
  hasUnviewed: boolean;
  stories: Story[];
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  media?: {
    url: string;
    type: 'image' | 'file';
  };
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  otherParticipant?: User;
  isOnline?: boolean;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender?: User;
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention' | 'repost' | 'system';
  post?: Post;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  _id: string;
  reporter: User;
  targetId: string;
  targetType: 'post' | 'user';
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy?: User;
  resolutionNotes?: string;
  createdAt: string;
}

export interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingReports: number;
  newUsersThisWeek: number;
  newPostsThisWeek: number;
}
