import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Users, PlusCircle, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { StoryBar } from '../components/stories/StoryBar';
import { PostCard } from '../components/feed/PostCard';
import { PostCardSkeleton } from '../components/common/Skeleton';
import { Avatar } from '../components/common/Avatar';
import { CreatePostModal } from '../components/feed/CreatePostModal';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'for-you' | 'following'>('for-you');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ data: Post[]; pagination: any }>({
    queryKey: ['feed', feedType],
    queryFn: async () => {
      const res = await api.get(`/posts/feed?type=${feedType}`);
      return res.data;
    },
  });

  const posts = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Feed Tabs Header */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0b0f19]/60 backdrop-blur-md sticky top-0 md:top-0 z-20 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 py-2">
        <button
          onClick={() => setFeedType('for-you')}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all relative ${
            feedType === 'for-you'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> For You
          </span>
          {feedType === 'for-you' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-brand-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setFeedType('following')}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all relative ${
            feedType === 'following'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Following
          </span>
          {feedType === 'following' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-brand-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Stories Rail */}
      <StoryBar />

      {/* Quick Create Post Prompt Card */}
      <div
        onClick={() => setIsCreateOpen(true)}
        className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm flex items-center gap-3 cursor-pointer hover:border-brand-500/50 transition-colors"
      >
        <Avatar src={user?.avatar} alt={user?.displayName} size="sm" isVerified={user?.isVerified} />
        <div className="flex-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl px-4 py-2 text-xs text-slate-400 select-none">
          What's happening? Share a thought or photo...
        </div>
        <button className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 rounded-xl">
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : isError ? (
          <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Failed to load feed
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs text-brand-500 hover:underline font-bold"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Sparkles className="w-10 h-10 text-brand-500 mx-auto opacity-75" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {feedType === 'following'
                ? "You're not following anyone with recent posts yet"
                : 'Your feed is quiet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Follow creators from the Explore page or create the first post to get the conversation started!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-sm"
            >
              Create a Post
            </button>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
