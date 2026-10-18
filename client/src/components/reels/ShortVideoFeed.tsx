import React, { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Bookmark } from 'lucide-react';
import { Post } from '../../types';
import { Avatar } from '../common/Avatar';
import { api } from '../../api/client';
import { PostDetailModal } from '../feed/PostDetailModal';

interface ShortVideoFeedProps {
  posts: Post[];
}

export const ShortVideoFeed: React.FC<ShortVideoFeedProps> = ({ posts }) => {
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
  const [activeModalPostId, setActiveModalPostId] = useState<string | null>(null);

  // Filter video posts
  const videoPosts = posts.filter(
    (p) => p.media && p.media.some((m) => m.type === 'video')
  );

  const handleLikeToggle = async (post: Post) => {
    const isLiked = likedPosts[post._id] ?? !!post.isLiked;
    const currentCount = likesCounts[post._id] ?? post.likesCount;

    setLikedPosts((prev) => ({ ...prev, [post._id]: !isLiked }));
    setLikesCounts((prev) => ({
      ...prev,
      [post._id]: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
    }));

    try {
      await api.post(`/posts/${post._id}/like`);
    } catch {
      setLikedPosts((prev) => ({ ...prev, [post._id]: isLiked }));
      setLikesCounts((prev) => ({ ...prev, [post._id]: currentCount }));
    }
  };

  if (videoPosts.length === 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No short videos uploaded yet!
        </p>
        <p className="text-xs text-slate-400">
          Post an MP4 video or story to see it featured in Reels.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-2">
      {videoPosts.map((post) => {
        const videoMedia = post.media.find((m) => m.type === 'video');
        if (!videoMedia) return null;

        const isLiked = likedPosts[post._id] ?? !!post.isLiked;
        const currentLikes = likesCounts[post._id] ?? post.likesCount;

        return (
          <div
            key={post._id}
            className="relative w-full max-w-sm h-[75vh] max-h-[680px] bg-black rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group"
          >
            {/* Video Element */}
            <video
              src={videoMedia.url}
              loop
              autoPlay
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Sound Toggle Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors z-20"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Right Action Bar */}
            <div className="absolute right-3 bottom-16 flex flex-col items-center gap-5 z-20 text-white">
              {/* Creator Avatar */}
              <NavLink to={`/profile/${post.author.username}`} className="relative">
                <Avatar
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  size="md"
                  isVerified={post.author.isVerified}
                />
              </NavLink>

              {/* Like */}
              <button
                onClick={() => handleLikeToggle(post)}
                className="flex flex-col items-center gap-1 group/btn"
              >
                <div
                  className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-125 ${
                    isLiked
                      ? 'bg-rose-500/80 text-white'
                      : 'bg-black/40 hover:bg-black/60 text-white'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-white' : ''}`} />
                </div>
                <span className="text-[11px] font-bold drop-shadow">{currentLikes}</span>
              </button>

              {/* Comment */}
              <button
                onClick={() => setActiveModalPostId(post._id)}
                className="flex flex-col items-center gap-1"
              >
                <div className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold drop-shadow">{post.commentsCount}</span>
              </button>

              {/* Share */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Video by ${post.author.displayName}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.origin + `/posts/${post._id}`);
                    alert('Video link copied!');
                  }
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold drop-shadow">{post.sharesCount || 0}</span>
              </button>
            </div>

            {/* Bottom Caption Overlay */}
            <div className="absolute bottom-0 left-0 right-16 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 text-white space-y-1.5">
              <NavLink
                to={`/profile/${post.author.username}`}
                className="text-sm font-bold hover:underline flex items-center gap-1.5 drop-shadow"
              >
                <span>{post.author.displayName}</span>
                <span className="text-xs text-white/70 font-normal">@{post.author.username}</span>
              </NavLink>

              <p className="text-xs text-white/90 drop-shadow line-clamp-2 leading-relaxed">
                {post.content}
              </p>
            </div>
          </div>
        );
      })}

      {/* Comment modal */}
      {activeModalPostId && (
        <PostDetailModal
          postId={activeModalPostId}
          isOpen={!!activeModalPostId}
          onClose={() => setActiveModalPostId(null)}
        />
      )}
    </div>
  );
};
