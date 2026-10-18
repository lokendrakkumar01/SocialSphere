import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
  user: mongoose.Types.ObjectId;
  target: mongoose.Types.ObjectId;
  targetType: 'Post' | 'Comment';
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Post', 'Comment'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

LikeSchema.index({ user: 1, target: 1 }, { unique: true });
LikeSchema.index({ target: 1 });

export const Like = mongoose.model<ILike>('Like', LikeSchema);
