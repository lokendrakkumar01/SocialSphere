import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  Share2,
  MoreHorizontal,
  Trash2,
  Flag,
} from 'lucide-react';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Avatar } from '../common/Avatar';
import { PostDetailModal } from './PostDetailModal';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(!!post.isLiked);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount);
  const [isSaved, setIsSaved] = useState<boolean>(!!post.isSaved);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?._id === post.author._id;
  const canModerate = isOwner || user?.role === 'admin' || user?.role === 'moderator';

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.post(`/posts/${post._id}/like`);
      if (res.data.success) {
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.likesCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      await api.post(`/posts/${post._id}/bookmark`);
    } catch {
      setIsSaved(prevSaved);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    setIsDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (err) {
      console.error('Delete post failed:', err);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = window.prompt('Please enter the reason for reporting this post:');
    if (!reason) return;

    try {
      await api.post('/admin/reports', {
        targetId: post._id,
        targetType: 'post',
        reason: 'inappropriate',
        details: reason,
      });
      alert('Report submitted for moderation review.');
    } catch (err) {
      console.error('Report failed:', err);
    } finally {
      setShowMenu(false);
    }
  };

  // Helper to format text with clickable hashtags & mentions
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/([#@]\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <NavLink
            key={index}
            to={`/explore?tag=${tag}`}
            onClick={(e) => e.stopPropagation()}
            className="text-brand-500 font-semibold hover:underline"
          >
            {part}
          </NavLink>
        );
      }
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <NavLink
            key={index}
            to={`/profile/${username}`}
            onClick={(e) => e.stopPropagation()}
            className="text-indigo-500 font-semibold hover:underline"
          >
            {part}
          </NavLink>
        );
      }
      return part;
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <article
        onClick={() => setIsDetailOpen(true)}
        className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none"
      >
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <NavLink
              to={`/profile/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                src={post.author.avatar}
                alt={post.author.displayName}
                size="md"
                isVerified={post.author.isVerified}
              />
            </NavLink>
            <div>
              <NavLink
                to={`/profile/${post.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:underline flex items-center gap-1"
              >
                <span>{post.author.displayName}</span>
              </NavLink>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1 z-20 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {canModerate && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                )}
                {!isOwner && (
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Text Content */}
        {post.content && (
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed mb-3 whitespace-pre-line">
            {renderFormattedContent(post.content)}
          </p>
        )}

        {/* Media Attachments */}
        {post.media && post.media.length > 0 && (
          <div className="rounded-xl overflow-hidden mb-3 border border-slate-200/60 dark:border-slate-800/60">
            {post.media[0].type === 'video' ? (
              <video
                src={post.media[0].url}
                controls
                className="w-full max-h-[500px] object-cover bg-black"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={post.media[0].url}
                alt="Post content"
                className="w-full max-h-[500px] object-cover hover:opacity-95 transition-opacity"
              />
            )}
          </div>
        )}

        {/* Interaction Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
          {/* Like */}
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg transition-colors ${
              isLiked
                ? 'text-rose-500'
                : 'hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isLiked ? 'fill-rose-500' : ''
              }`}
            />
            <span>{likesCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setIsDetailOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount}</span>
          </button>

          {/* Repost / Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({
                  title: `Post by ${post.author.displayName}`,
                  text: post.content,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.origin + `/posts/${post._id}`);
                alert('Post link copied to clipboard!');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          >
            <Repeat className="w-4 h-4" />
            <span>{post.sharesCount || 0}</span>
          </button>

          {/* Save / Bookmark */}
          <button
            onClick={handleBookmarkToggle}
            className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg transition-colors ${
              isSaved
                ? 'text-brand-500'
                : 'hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${isSaved ? 'fill-brand-500' : ''}`}
            />
          </button>
        </div>
      </article>

      {/* Post Details & Threaded Comments Modal */}
      {isDetailOpen && (
        <PostDetailModal
          postId={post._id}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </>
  );
};
