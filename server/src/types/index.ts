import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'user' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface AuthUserPayload {
  userId: string;
  username: string;
  role: UserRole;
  status: AccountStatus;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export type PostVisibility = 'public' | 'followers' | 'private';

export interface IMediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  width?: number;
  height?: number;
}
