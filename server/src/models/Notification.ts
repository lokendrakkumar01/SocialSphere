import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'follow_request'
  | 'mention'
  | 'repost'
  | 'system';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: NotificationType;
  post?: mongoose.Types.ObjectId;
  message?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: ['like', 'comment', 'follow', 'follow_request', 'mention', 'repost', 'system'],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    message: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
  }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
