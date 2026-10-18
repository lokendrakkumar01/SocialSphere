import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { Post } from '../types';
import { PostCard } from '../components/feed/PostCard';
import { PostCardSkeleton } from '../components/common/Skeleton';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTag = searchParams.get('tag');

  const { data: trending = [] } = useQuery<{ tag: string; count: number }[]>({
    queryKey: ['trending'],
    queryFn: async () => {
      const res = await api.get('/search/trending');
      return res.data.data;
    },
  });

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['explore', currentTag],
    queryFn: async () => {
      const endpoint = currentTag ? `/search?q=%23${currentTag}` : '/posts/explore';
      const res = await api.get(endpoint);
      return currentTag ? res.data.data.posts : res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Compass className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Explore & Discover
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Uncover trending conversations, viral media, and top community creators.
        </p>
      </div>

      {/* Trending Hashtag Filters */}
      {trending.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Popular Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchParams({})}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !currentTag
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Topics
            </button>
            {trending.map((item) => (
              <button
                key={item.tag}
                onClick={() => setSearchParams({ tag: item.tag })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentTag === item.tag
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                #{item.tag} <span className="opacity-70 text-[10px]">({item.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-brand-500 opacity-60" />
            <p className="text-xs font-semibold">No posts found for this topic</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>
    </div>
  );
};
