import mongoose, { Document, Schema } from 'mongoose';

export interface IFollow extends Document {
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  status: 'accepted' | 'pending';
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['accepted', 'pending'],
      default: 'accepted',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = mongoose.model<IFollow>('Follow', FollowSchema);
