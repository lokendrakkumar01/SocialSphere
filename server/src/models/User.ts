import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, AccountStatus } from '../types';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  website: string;
  isPrivate: boolean;
  isVerified: boolean;
  role: UserRole;
  status: AccountStatus;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  blockedUsers: mongoose.Types.ObjectId[];
  mutedUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: '',
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 250,
    },
    website: {
      type: String,
      default: '',
      maxlength: 100,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mutedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_, ret: any) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.index({ username: 'text', displayName: 'text' });
UserSchema.index({ followersCount: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
