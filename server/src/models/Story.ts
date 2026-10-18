import mongoose, { Document, Schema } from 'mongoose';

export interface IStory extends Document {
  author: mongoose.Types.ObjectId;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewers: mongoose.Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    caption: {
      type: String,
      maxlength: 200,
      default: '',
    },
    viewers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // 24hr TTL index
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

StorySchema.index({ author: 1, expiresAt: 1 });

export const Story = mongoose.model<IStory>('Story', StorySchema);
