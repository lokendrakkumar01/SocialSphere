import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Post } from '../../types';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { CommentSection } from './CommentSection';

interface PostDetailModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({ postId, isOpen, onClose }) => {
  const { data: post, isLoading } = useQuery<Post>({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}`);
      return res.data.data;
    },
    enabled: isOpen,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post Discussion" maxWidth="lg">
      {isLoading || !post ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading post...</div>
      ) : (
        <div className="space-y-4">
          {/* Post Header */}
          <div className="flex items-center gap-3">
            <Avatar
              src={post.author.avatar}
              alt={post.author.displayName}
              size="md"
              isVerified={post.author.isVerified}
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{post.author.displayName}</p>
              <p className="text-xs text-slate-400">@{post.author.username}</p>
            </div>
          </div>

          {/* Post Content */}
          {post.content && (
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>
          )}

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              {post.media[0].type === 'video' ? (
                <video src={post.media[0].url} controls className="w-full max-h-96 object-cover" />
              ) : (
                <img src={post.media[0].url} alt="Attachment" className="w-full max-h-96 object-cover" />
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Comments ({post.commentsCount})
            </h4>
            <CommentSection postId={post._id} />
          </div>
        </div>
      )}
    </Modal>
  );
};
