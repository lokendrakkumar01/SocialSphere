import { Response } from 'express';
import { z } from 'zod';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { Like } from '../models/Like';
import { AuthenticatedRequest } from '../types';
import { createNotification } from '../services/notificationService';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500),
  parentComment: z.string().optional(),
});

export const createComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const authorId = req.user!.userId;
  const { postId } = req.params;
  const { content, parentComment } = req.body;

  const post = await Post.findOne({ _id: postId, isDeleted: false });
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  const comment = await Comment.create({
    post: postId,
    author: authorId,
    content: content.trim(),
    parentComment: parentComment || null,
  });

  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  await createNotification({
    recipient: post.author,
    sender: authorId,
    type: 'comment',
    post: post._id,
    message: 'commented on your post',
  });

  const populated = await Comment.findById(comment._id).populate(
    'author',
    'username displayName avatar isVerified'
  );

  res.status(201).json({
    success: true,
    message: 'Comment added',
    data: populated,
  });
};

export const getCommentsForPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;
  const currentUserId = req.user?.userId;

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: 1 })
    .populate('author', 'username displayName avatar isVerified');

  // Check liked comments
  const commentIds = comments.map((c) => c._id);
  let likedCommentIds: string[] = [];

  if (currentUserId) {
    const likes = await Like.find({
      user: currentUserId,
      target: { $in: commentIds },
      targetType: 'Comment',
    });
    likedCommentIds = likes.map((l) => l.target.toString());
  }

  const formattedComments = comments.map((c) => ({
    ...c.toJSON(),
    isLiked: likedCommentIds.includes(c._id.toString()),
  }));

  res.status(200).json({
    success: true,
    data: formattedComments,
  });
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { commentId } = req.params;
  const userId = req.user!.userId;
  const role = req.user!.role;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404).json({ success: false, message: 'Comment not found' });
    return;
  }

  const post = await Post.findById(comment.post);

  // Author, post owner, or admin can delete comment
  const isPostOwner = post && post.author.toString() === userId;
  const isCommentAuthor = comment.author.toString() === userId;
  const isAdmin = role === 'admin' || role === 'moderator';

  if (!isCommentAuthor && !isPostOwner && !isAdmin) {
    res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
    return;
  }

  await Comment.findByIdAndDelete(commentId);
  await Comment.deleteMany({ parentComment: commentId }); // cascade delete child replies
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

  res.status(200).json({
    success: true,
    message: 'Comment deleted',
  });
};

export const toggleLikeComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { commentId } = req.params;
  const userId = req.user!.userId;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404).json({ success: false, message: 'Comment not found' });
    return;
  }

  const existingLike = await Like.findOne({
    user: userId,
    target: commentId,
    targetType: 'Comment',
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });
    res.status(200).json({ success: true, isLiked: false, likesCount: Math.max(0, comment.likesCount - 1) });
  } else {
    await Like.create({ user: userId, target: commentId, targetType: 'Comment' });
    await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });
    res.status(200).json({ success: true, isLiked: true, likesCount: comment.likesCount + 1 });
  }
};
