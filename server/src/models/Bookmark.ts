import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmark extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

BookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
BookmarkSchema.index({ user: 1, createdAt: -1 });

export const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
