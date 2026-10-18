import mongoose, { Document, Schema } from 'mongoose';
import { PostVisibility, IMediaItem } from '../types';

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  media: IMediaItem[];
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  visibility: PostVisibility;
  originalPost?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnail: { type: String },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    media: [MediaItemSchema],
    hashtags: [{ type: String, lowercase: true, trim: true }],
    mentions: [{ type: String, lowercase: true, trim: true }],
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    sharesCount: { type: Number, default: 0, min: 0 },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    originalPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ content: 'text' });
PostSchema.index({ author: 1, createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
