import { Response } from 'express';
import { Story } from '../models/Story';
import { Follow } from '../models/Follow';
import { AuthenticatedRequest } from '../types';

export const getStoriesFeed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user!.userId;
  const now = new Date();

  // Find users followed by current user
  const follows = await Follow.find({ follower: currentUserId, status: 'accepted' });
  const followingUserIds = follows.map((f) => f.following);

  // Active stories from following + self
  const authorIds = [...followingUserIds, currentUserId];

  const stories = await Story.find({
    author: { $in: authorIds },
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: 1 })
    .populate('author', 'username displayName avatar isVerified');

  // Group stories by author
  const groupedMap = new Map<string, any>();

  stories.forEach((story) => {
    const authorId = (story.author as any)._id.toString();
    const hasViewed = story.viewers.some((id) => id.toString() === currentUserId);

    if (!groupedMap.has(authorId)) {
      groupedMap.set(authorId, {
        author: story.author,
        isSelf: authorId === currentUserId,
        hasUnviewed: !hasViewed,
        stories: [],
      });
    }

    const group = groupedMap.get(authorId);
    if (!hasViewed) {
      group.hasUnviewed = true;
    }

    group.stories.push({
      ...story.toJSON(),
      hasViewed,
    });
  });

  // Convert map to array: self first, then unviewed, then viewed
  const result = Array.from(groupedMap.values()).sort((a, b) => {
    if (a.isSelf) return -1;
    if (b.isSelf) return 1;
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (!a.hasUnviewed && b.hasUnviewed) return 1;
    return 0;
  });

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const createStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const authorId = req.user!.userId;
  const { mediaUrl, mediaType, caption } = req.body;

  if (!mediaUrl) {
    res.status(400).json({ success: false, message: 'mediaUrl is required' });
    return;
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration

  const story = await Story.create({
    author: authorId,
    mediaUrl,
    mediaType: mediaType || 'image',
    caption: caption || '',
    expiresAt,
    viewers: [authorId],
  });

  const populated = await Story.findById(story._id).populate(
    'author',
    'username displayName avatar isVerified'
  );

  res.status(201).json({
    success: true,
    message: 'Story created',
    data: populated,
  });
};

export const markStoryViewed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user!.userId;
  const { storyId } = req.params;

  await Story.findByIdAndUpdate(storyId, {
    $addToSet: { viewers: currentUserId },
  });

  res.status(200).json({
    success: true,
    message: 'Story marked as viewed',
  });
};

export const deleteStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user!.userId;
  const role = req.user!.role;
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    res.status(404).json({ success: false, message: 'Story not found' });
    return;
  }

  if (story.author.toString() !== currentUserId && role !== 'admin' && role !== 'moderator') {
    res.status(403).json({ success: false, message: 'Unauthorized' });
    return;
  }

  await Story.findByIdAndDelete(storyId);

  res.status(200).json({
    success: true,
    message: 'Story deleted',
  });
};
