import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../types';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username displayName avatar isVerified')
    .populate('post', 'content media');

  const total = await Notification.countDocuments({ recipient: userId });
  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
  });
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
};
