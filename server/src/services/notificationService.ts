import mongoose from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { emitToUser } from './socket';

export const createNotification = async (params: {
  recipient: string | mongoose.Types.ObjectId;
  sender?: string | mongoose.Types.ObjectId;
  type: NotificationType;
  post?: string | mongoose.Types.ObjectId;
  message?: string;
}): Promise<void> => {
  try {
    // Avoid sending notification to oneself
    if (params.sender && params.recipient.toString() === params.sender.toString()) {
      return;
    }

    const notification = await Notification.create({
      recipient: params.recipient,
      sender: params.sender,
      type: params.type,
      post: params.post,
      message: params.message || '',
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'username displayName avatar isVerified')
      .populate('post', 'content media');

    // Emit real-time socket event
    emitToUser(params.recipient.toString(), 'new_notification', populatedNotification);
  } catch (err: any) {
    console.error('[NotificationService] Error creating notification:', err.message);
  }
};
