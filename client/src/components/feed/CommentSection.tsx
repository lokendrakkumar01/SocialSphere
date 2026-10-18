import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Reply, Trash2, Send, CornerDownRight } from 'lucide-react';
import { api } from '../../api/client';
import { Comment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

interface CommentSectionProps {
  postId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await api.get(`/comments/post/${postId}`);
      return res.data.data;
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ text, parentComment }: { text: string; parentComment?: string }) => {
      const res = await api.post(`/comments/post/${postId}`, {
        content: text,
        parentComment,
      });
      return res.data.data;
    },
    onSuccess: () => {
      setCommentText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.post(`/comments/${commentId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({
      text: commentText.trim(),
      parentComment: replyingTo ? replyingTo._id : undefined,
    });
  };

  // Group top-level comments and replies
  const topLevelComments = comments.filter((c) => !c.parentComment);
  const repliesMap = new Map<string, Comment[]>();

  comments.forEach((c) => {
    if (c.parentComment) {
      if (!repliesMap.has(c.parentComment)) {
        repliesMap.set(c.parentComment, []);
      }
      repliesMap.get(c.parentComment)!.push(c);
    }
  });

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {replyingTo && (
          <div className="flex items-center justify-between text-xs bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5" />
              Replying to @{replyingTo.author.username}
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="font-bold hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Avatar src={user?.avatar} alt={user?.displayName} size="sm" />
          <div className="relative flex-1">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.author.username}...` : 'Write a comment...'}
              className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || addCommentMutation.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-500 hover:text-brand-600 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading comments...</p>
        ) : topLevelComments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be the first to reply!</p>
        ) : (
          topLevelComments.map((comment) => {
            const replies = repliesMap.get(comment._id) || [];
            const canDelete =
              user?._id === comment.author._id || user?.role === 'admin' || user?.role === 'moderator';

            return (
              <div key={comment._id} className="space-y-2 text-xs">
                {/* Main Comment */}
                <div className="flex items-start gap-2.5">
                  <Avatar src={comment.author.avatar} alt={comment.author.displayName} size="xs" />
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {comment.author.displayName}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => deleteCommentMutation.mutate(comment._id)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{comment.content}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <button
                        onClick={() => toggleLikeMutation.mutate(comment._id)}
                        className={`flex items-center gap-1 ${
                          comment.isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-rose-500' : ''}`} />
                        <span>{comment.likesCount}</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(comment)}
                        className="flex items-center gap-1 hover:text-brand-500"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Threaded Replies */}
                {replies.length > 0 && (
                  <div className="pl-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                    {replies.map((reply) => {
                      const canDeleteReply =
                        user?._id === reply.author._id ||
                        user?.role === 'admin' ||
                        user?.role === 'moderator';

                      return (
                        <div key={reply._id} className="flex items-start gap-2">
                          <Avatar src={reply.author.avatar} alt={reply.author.displayName} size="xs" />
                          <div className="flex-1 bg-slate-50/80 dark:bg-slate-800/40 p-2 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {reply.author.displayName}
                              </span>
                              {canDeleteReply && (
                                <button
                                  onClick={() => deleteCommentMutation.mutate(reply._id)}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">{reply.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
