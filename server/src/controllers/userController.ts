import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Follow } from '../models/Follow';
import { Post } from '../models/Post';
import { Like } from '../models/Like';
import { Bookmark } from '../models/Bookmark';
import { Comment } from '../models/Comment';
import { AuthenticatedRequest } from '../types';
import { createNotification } from '../services/notificationService';

export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { username } = req.params;
  const currentUserId = req.user?.userId;

  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  let isFollowing = false;
  let isFollowRequested = false;
  let isBlocked = false;

  if (currentUserId) {
    if (user.blockedUsers.some((id) => id.toString() === currentUserId)) {
      res.status(403).json({ success: false, message: 'You cannot view this profile' });
      return;
    }

    const currentUser = await User.findById(currentUserId);
    if (currentUser?.blockedUsers.some((id) => id.toString() === user._id.toString())) {
      isBlocked = true;
    }

    const followRecord = await Follow.findOne({
      follower: currentUserId,
      following: user._id,
    });

    if (followRecord) {
      if (followRecord.status === 'accepted') isFollowing = true;
      if (followRecord.status === 'pending') isFollowRequested = true;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),
      isFollowing,
      isFollowRequested,
      isBlocked,
    },
  });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { displayName, bio, website, avatar, coverPhoto, isPrivate } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (displayName !== undefined) user.displayName = displayName.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (website !== undefined) user.website = website.trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (coverPhoto !== undefined) user.coverPhoto = coverPhoto;
  if (isPrivate !== undefined) user.isPrivate = Boolean(isPrivate);

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
};

export const followUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const followerId = req.user!.userId;
  const { targetId } = req.params;

  if (followerId === targetId) {
    res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    return;
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const existingFollow = await Follow.findOne({ follower: followerId, following: targetId });
  if (existingFollow) {
    res.status(400).json({ success: false, message: 'Already following or requested' });
    return;
  }

  const status = targetUser.isPrivate ? 'pending' : 'accepted';

  await Follow.create({
    follower: followerId,
    following: targetId,
    status,
  });

  if (status === 'accepted') {
    await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });

    await createNotification({
      recipient: targetId,
      sender: followerId,
      type: 'follow',
      message: 'started following you',
    });
  } else {
    await createNotification({
      recipient: targetId,
      sender: followerId,
      type: 'follow_request',
      message: 'requested to follow you',
    });
  }

  res.status(200).json({
    success: true,
    message: status === 'accepted' ? 'Followed successfully' : 'Follow request sent',
    status,
  });
};

export const unfollowUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const followerId = req.user!.userId;
  const { targetId } = req.params;

  const followRecord = await Follow.findOneAndDelete({ follower: followerId, following: targetId });
  if (!followRecord) {
    res.status(400).json({ success: false, message: 'You are not following this user' });
    return;
  }

  if (followRecord.status === 'accepted') {
    await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
  }

  res.status(200).json({
    success: true,
    message: 'Unfollowed successfully',
  });
};

export const getFollowers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { targetId } = req.params;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  const follows = await Follow.find({ following: targetId, status: 'accepted' })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('follower', 'username displayName avatar isVerified bio');

  const total = await Follow.countDocuments({ following: targetId, status: 'accepted' });

  res.status(200).json({
    success: true,
    data: follows.map((f) => f.follower),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const getFollowing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { targetId } = req.params;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  const follows = await Follow.find({ follower: targetId, status: 'accepted' })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('following', 'username displayName avatar isVerified bio');

  const total = await Follow.countDocuments({ follower: targetId, status: 'accepted' });

  res.status(200).json({
    success: true,
    data: follows.map((f) => f.following),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const getUserPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { targetId } = req.params;
  const currentUserId = req.user?.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 15;

  const query: any = { author: targetId, isDeleted: false };

  // Check privacy
  if (currentUserId !== targetId) {
    const targetUser = await User.findById(targetId);
    if (targetUser?.isPrivate) {
      const isFollowing = currentUserId
        ? await Follow.exists({ follower: currentUserId, following: targetId, status: 'accepted' })
        : false;
      if (!isFollowing) {
        res.status(403).json({ success: false, message: 'This account is private' });
        return;
      }
    }
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

  // Attach liked & saved status
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
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const getUserLikedPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { targetId } = req.params;
  const currentUserId = req.user?.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 15;

  const likes = await Like.find({ user: targetId, targetType: 'Post' })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: 'target',
      populate: { path: 'author', select: 'username displayName avatar isVerified' },
    });

  const posts = likes.map((l) => l.target).filter(Boolean);

  res.status(200).json({
    success: true,
    data: posts,
  });
};

export const getUserSavedPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 15;

  const bookmarks = await Bookmark.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: 'post',
      populate: { path: 'author', select: 'username displayName avatar isVerified' },
    });

  const posts = bookmarks.map((b) => b.post).filter(Boolean);

  res.status(200).json({
    success: true,
    data: posts,
  });
};

export const blockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user!.userId;
  const { targetId } = req.params;

  if (currentUserId === targetId) {
    res.status(400).json({ success: false, message: 'You cannot block yourself' });
    return;
  }

  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { blockedUsers: targetId },
  });

  // Automatically remove follow relationships
  await Follow.deleteMany({
    $or: [
      { follower: currentUserId, following: targetId },
      { follower: targetId, following: currentUserId },
    ],
  });

  res.status(200).json({ success: true, message: 'User blocked successfully' });
};

export const unblockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user!.userId;
  const { targetId } = req.params;

  await User.findByIdAndUpdate(currentUserId, {
    $pull: { blockedUsers: targetId },
  });

  res.status(200).json({ success: true, message: 'User unblocked successfully' });
};

export const exportUserData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const user = await User.findById(userId);
  const posts = await Post.find({ author: userId, isDeleted: false });
  const comments = await Comment.find({ author: userId });

  res.status(200).json({
    success: true,
    data: {
      profile: user,
      posts,
      comments,
      exportedAt: new Date().toISOString(),
    },
  });
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  // Soft delete / anonymize
  await User.findByIdAndUpdate(userId, {
    status: 'banned',
    displayName: 'Deleted User',
    bio: '',
    avatar: '',
  });

  await Post.updateMany({ author: userId }, { isDeleted: true });

  res.status(200).json({
    success: true,
    message: 'Your account has been deleted successfully',
  });
};
