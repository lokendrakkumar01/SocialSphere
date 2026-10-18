import { Response } from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { emitToConversation, emitToUser, isUserOnline } from '../services/socket';

export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const conversations = await Conversation.find({ participants: userId })
    .sort({ updatedAt: -1 })
    .populate('participants', 'username displayName avatar isVerified status')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username displayName' },
    });

  // Calculate unread counts for each conversation
  const results = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      });

      // Filter out self from otherParticipant
      const otherParticipant = conv.participants.find(
        (p: any) => p._id.toString() !== userId
      );

      const otherUserId = otherParticipant ? (otherParticipant as any)._id.toString() : '';

      return {
        ...conv.toJSON(),
        unreadCount,
        otherParticipant,
        isOnline: otherUserId ? isUserOnline(otherUserId) : false,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: results,
  });
};

export const getOrCreateConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user!.userId;
  const { participantId } = req.body;

  if (!participantId) {
    res.status(400).json({ success: false, message: 'participantId is required' });
    return;
  }

  if (currentUserId === participantId) {
    res.status(400).json({ success: false, message: 'Cannot start conversation with yourself' });
    return;
  }

  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, participantId], $size: 2 },
  })
    .populate('participants', 'username displayName avatar isVerified')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [currentUserId, participantId],
    });
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username displayName avatar isVerified')
      .populate('lastMessage');
  }

  res.status(200).json({
    success: true,
    data: conversation,
  });
};

export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 30;

  // Verify participation
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    res.status(403).json({ success: false, message: 'Conversation not found or access denied' });
    return;
  }

  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username displayName avatar');

  const total = await Message.countDocuments({ conversation: conversationId });

  res.status(200).json({
    success: true,
    data: messages.reverse(), // reverse to chronological order
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const senderId = req.user!.userId;
  const { conversationId } = req.params;
  const { content, media } = req.body;

  if (!content?.trim() && !media) {
    res.status(400).json({ success: false, message: 'Message content or media is required' });
    return;
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
  });

  if (!conversation) {
    res.status(403).json({ success: false, message: 'Conversation not found or access denied' });
    return;
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content: content ? content.trim() : '',
    media: media || undefined,
    readBy: [senderId],
  });

  conversation.lastMessage = message._id as any;
  conversation.updatedAt = new Date();
  await conversation.save();

  const populatedMessage = await Message.findById(message._id).populate(
    'sender',
    'username displayName avatar'
  );

  // Broadcast to room
  emitToConversation(conversationId, 'new_message', populatedMessage);

  // Also emit to the recipient's personal socket room for unread badges
  const recipientId = conversation.participants.find(
    (id) => id.toString() !== senderId
  );
  if (recipientId) {
    emitToUser(recipientId.toString(), 'new_message_notification', {
      conversationId,
      message: populatedMessage,
    });
  }

  res.status(201).json({
    success: true,
    data: populatedMessage,
  });
};

export const markConversationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { conversationId } = req.params;

  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
    }
  );

  emitToConversation(conversationId, 'messages_marked_read', {
    conversationId,
    userId,
  });

  res.status(200).json({
    success: true,
    message: 'Conversation marked as read',
  });
};
