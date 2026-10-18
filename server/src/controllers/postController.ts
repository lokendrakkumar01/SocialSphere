import { Response } from 'express';
import { z } from 'zod';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Like } from '../models/Like';
import { Bookmark } from '../models/Bookmark';
import { Follow } from '../models/Follow';
import { AuthenticatedRequest } from '../types';
import { createNotification } from '../services/notificationService';

export const createPostSchema = z.object({
  content: z.string().max(2000).default(''),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(['image', 'video']),
        thumbnail: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .default([]),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  originalPost: z.string().optional(),
});

// Helper to extract hashtags and mentions
const extractMeta = (text: string) => {
  const hashtagRegex = /#(\w+)/g;
  const mentionRegex = /@(\w+)/g;

  const hashtags = Array.from(text.matchAll(hashtagRegex), (m) => m[1].toLowerCase());
  const mentions = Array.from(mentionRegex.source ? text.matchAll(mentionRegex) : [], (m) => m[1].toLowerCase());

  return {
    hashtags: Array.from(new Set(hashtags)),
    mentions: Array.from(new Set(mentions)),
  };
};

export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const authorId = req.user!.userId;
  const { content, media, visibility, originalPost } = req.body;

  if (!content.trim() && (!media || media.length === 0) && !originalPost) {
    res.status(400).json({ success: false, message: 'Post content or media is required' });
    return;
  }

  const { hashtags, mentions } = extractMeta(content);

  const post = await Post.create({
    author: authorId,
    content: content.trim(),
    media,
    visibility,
    hashtags,
    mentions,
    originalPost: originalPost || undefined,
  });

  await User.findByIdAndUpdate(authorId, { $inc: { postsCount: 1 } });

  // Handle repost share count
  if (originalPost) {
    await Post.findByIdAndUpdate(originalPost, { $inc: { sharesCount: 1 } });
    const original = await Post.findById(originalPost);
    if (original) {
      await createNotification({
        recipient: original.author,
        sender: authorId,
        type: 'repost',
        post: post._id,
        message: 'reposted your post',
      });
    }
  }

  // Handle mentions notifications
  if (mentions.length > 0) {
    const mentionedUsers = await User.find({ username: { $in: mentions } });
    for (const u of mentionedUsers) {
      await createNotification({
        recipient: u._id,
        sender: authorId,
        type: 'mention',
        post: post._id,
        message: 'mentioned you in a post',
      });
    }
  }

  const populated = await Post.findById(post._id)
    .populate('author', 'username displayName avatar isVerified')
    .populate({
      path: 'originalPost',
      populate: { path: 'author', select: 'username displayName avatar isVerified' },
    });

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: populated,
  });
};

export const getFeed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user?.userId;
  const feedType = (req.query.type as string) || 'for-you';
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 15;

  let blockedUserIds: any[] = [];
  let followingUserIds: any[] = [];

  if (currentUserId) {
    const currentUser = await User.findById(currentUserId);
    blockedUserIds = currentUser?.blockedUsers || [];

    const follows = await Follow.find({ follower: currentUserId, status: 'accepted' });
    followingUserIds = follows.map((f) => f.following);
  }

  let query: any = {
    isDeleted: false,
    author: { $nin: blockedUserIds },
  };

  if (feedType === 'following' && currentUserId) {
    query.author = { $in: [...followingUserIds, currentUserId] };
  } else {
    // For-You feed: public posts or posts from followed creators
    query.$or = [{ visibility: 'public' }, { author: { $in: [...followingUserIds, currentUserId] } }];
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'username displayName avatar isVerified')
    .populate({
      path: 'originalPost',
      populate: { path: 'author', select: 'username displayName avatar isVerified' },
    });

  const total = await Post.countDocuments(query);

  // Attach isLiked and isSaved
  const postIds = posts.map((p) => p._id);
  let likedPostIds: string[] = [];
  let savedPostIds: string[] = [];

  if (currentUserId) {
    const likes = await Like.find({ user: currentUserId, target: { $in: postIds }, targetType: 'Post' });
    likedPostIds = likes.map((l) => l.target.toString());

    const bookmarks = await Bookmark.find({ user: currentUserId, post: { $in: postIds } });
    savedPostIds = bookmarks.map((b) => b.post.toString());
  }

  const formattedPosts = posts.map((p) => ({
    ...p.toJSON(),
    isLiked: likedPostIds.includes(p._id.toString()),
    isSaved: savedPostIds.includes(p._id.toString()),
  }));

  res.status(200).json({
    success: true,
    data: formattedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
};

export const getExploreFeed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user?.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  let blockedUserIds: any[] = [];
  if (currentUserId) {
    const currentUser = await User.findById(currentUserId);
    blockedUserIds = currentUser?.blockedUsers || [];
  }

  const query: any = {
    isDeleted: false,
    visibility: 'public',
    author: { $nin: blockedUserIds },
  };

  // Sort by popular engagement: likesCount and commentsCount
  const posts = await Post.find(query)
    .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'username displayName avatar isVerified');

  const total = await Post.countDocuments(query);

  const postIds = posts.map((p) => p._id);
  let likedPostIds: string[] = [];
  let savedPostIds: string[] = [];

  if (currentUserId) {
    const likes = await Like.find({ user: currentUserId, target: { $in: postIds }, targetType: 'Post' });
    likedPostIds = likes.map((l) => l.target.toString());

    const bookmarks = await Bookmark.find({ user: currentUserId, post: { $in: postIds } });
    savedPostIds = bookmarks.map((b) => b.post.toString());
  }

  const formattedPosts = posts.map((p) => ({
    ...p.toJSON(),
    isLiked: likedPostIds.includes(p._id.toString()),
    isSaved: savedPostIds.includes(p._id.toString()),
  }));

  res.status(200).json({
    success: true,
    data: formattedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
};

export const getPostById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUserId = req.user?.userId;

  const post = await Post.findOne({ _id: id, isDeleted: false })
    .populate('author', 'username displayName avatar isVerified')
    .populate({
      path: 'originalPost',
      populate: { path: 'author', select: 'username displayName avatar isVerified' },
    });

  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  let isLiked = false;
  let isSaved = false;

  if (currentUserId) {
    isLiked = (await Like.exists({ user: currentUserId, target: post._id, targetType: 'Post' })) !== null;
    isSaved = (await Bookmark.exists({ user: currentUserId, post: post._id })) !== null;
  }

  res.status(200).json({
    success: true,
    data: {
      ...post.toJSON(),
      isLiked,
      isSaved,
    },
  });
};

export const updatePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { content } = req.body;

  const post = await Post.findOne({ _id: id, author: userId, isDeleted: false });
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    return;
  }

  if (content !== undefined) {
    post.content = content.trim();
    const { hashtags, mentions } = extractMeta(content);
    post.hashtags = hashtags;
    post.mentions = mentions;
  }

  await post.save();

  res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: post,
  });
};

export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const role = req.user!.role;

  const post = await Post.findById(id);
  if (!post || post.isDeleted) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  if (post.author.toString() !== userId && role !== 'admin' && role !== 'moderator') {
    res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
    return;
  }

  post.isDeleted = true;
  await post.save();

  await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
};

export const toggleLike = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const post = await Post.findOne({ _id: id, isDeleted: false });
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  const existingLike = await Like.findOne({ user: userId, target: id, targetType: 'Post' });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    await Post.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });
    res.status(200).json({ success: true, isLiked: false, likesCount: Math.max(0, post.likesCount - 1) });
  } else {
    await Like.create({ user: userId, target: id, targetType: 'Post' });
    await Post.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });

    await createNotification({
      recipient: post.author,
      sender: userId,
      type: 'like',
      post: post._id,
      message: 'liked your post',
    });

    res.status(200).json({ success: true, isLiked: true, likesCount: post.likesCount + 1 });
  }
};

export const toggleBookmark = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const post = await Post.findOne({ _id: id, isDeleted: false });
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  const existingBookmark = await Bookmark.findOne({ user: userId, post: id });

  if (existingBookmark) {
    await Bookmark.findByIdAndDelete(existingBookmark._id);
    res.status(200).json({ success: true, isSaved: false, message: 'Post removed from saved' });
  } else {
    await Bookmark.create({ user: userId, post: id });
    res.status(200).json({ success: true, isSaved: true, message: 'Post saved successfully' });
  }
};
