import { Response } from 'express';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Follow } from '../models/Follow';
import { AuthenticatedRequest } from '../types';

export const searchGlobal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const query = (req.query.q as string || '').trim();
  const currentUserId = req.user?.userId;

  if (!query) {
    res.status(200).json({ success: true, data: { users: [], posts: [], hashtags: [] } });
    return;
  }

  const isHashtagSearch = query.startsWith('#');
  const cleanTerm = query.replace(/^#/, '');

  // 1. Search Users
  const users = await User.find({
    status: 'active',
    $or: [
      { username: { $regex: cleanTerm, $options: 'i' } },
      { displayName: { $regex: cleanTerm, $options: 'i' } },
    ],
  })
    .limit(10)
    .select('username displayName avatar isVerified bio followersCount');

  // 2. Search Posts
  const postQuery: any = { isDeleted: false, visibility: 'public' };
  if (isHashtagSearch) {
    postQuery.hashtags = cleanTerm.toLowerCase();
  } else {
    postQuery.$or = [
      { content: { $regex: query, $options: 'i' } },
      { hashtags: cleanTerm.toLowerCase() },
    ];
  }

  const posts = await Post.find(postQuery)
    .sort({ createdAt: -1 })
    .limit(15)
    .populate('author', 'username displayName avatar isVerified');

  // 3. Search Matching Hashtags
  const matchingHashtags = await Post.aggregate([
    { $match: { isDeleted: false, visibility: 'public' } },
    { $unwind: '$hashtags' },
    { $match: { hashtags: { $regex: cleanTerm, $options: 'i' } } },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      posts,
      hashtags: matchingHashtags.map((h) => ({ tag: h._id, count: h.count })),
    },
  });
};

export const getTrending = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trendingHashtags = await Post.aggregate([
    {
      $match: {
        isDeleted: false,
        visibility: 'public',
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    data: trendingHashtags.map((h) => ({ tag: h._id, count: h.count })),
  });
};

export const getSuggestedUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user?.userId;

  let excludeIds: any[] = [];
  if (currentUserId) {
    excludeIds.push(currentUserId);
    const follows = await Follow.find({ follower: currentUserId });
    excludeIds.push(...follows.map((f) => f.following));
  }

  const users = await User.find({
    _id: { $nin: excludeIds },
    status: 'active',
  })
    .sort({ followersCount: -1, isVerified: -1 })
    .limit(8)
    .select('username displayName avatar isVerified bio followersCount');

  res.status(200).json({
    success: true,
    data: users,
  });
};
