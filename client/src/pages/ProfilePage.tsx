import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Grid, Image as ImageIcon, Heart, Bookmark, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { User, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PostCard } from '../components/feed/PostCard';
import { PostCardSkeleton } from '../components/common/Skeleton';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'likes' | 'saved'>('posts');

  const resolvedUsername = username === 'me' ? currentUser?.username : username;

  // 1. Fetch User Profile
  const {
    data: profileUser,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery<User>({
    queryKey: ['profile', resolvedUsername],
    queryFn: async () => {
      const res = await api.get(`/users/profile/${resolvedUsername}`);
      return res.data.data;
    },
    enabled: !!resolvedUsername,
  });

  const isSelf = currentUser?._id === profileUser?._id;

  // 2. Fetch User's Posts / Likes / Saved based on activeTab
  const { data: posts = [], isLoading: isPostsLoading } = useQuery<Post[]>({
    queryKey: ['profile-posts', profileUser?._id, activeTab],
    queryFn: async () => {
      if (!profileUser?._id) return [];

      let endpoint = `/users/${profileUser._id}/posts`;
      if (activeTab === 'likes') endpoint = `/users/${profileUser._id}/likes`;
      if (activeTab === 'saved') endpoint = `/users/saved`;

      const res = await api.get(endpoint);
      return res.data.data;
    },
    enabled: !!profileUser?._id,
  });

  if (isProfileLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading profile...
      </div>
    );
  }

  if (isProfileError || !profileUser) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          User Not Found
        </h3>
        <p className="text-xs text-slate-400">
          The user "@{resolvedUsername}" may not exist or has set their account to private.
        </p>
      </div>
    );
  }

  const displayedPosts =
    activeTab === 'media'
      ? posts.filter((p) => p.media && p.media.length > 0)
      : posts;

  return (
    <div>
      <ProfileHeader
        profileUser={profileUser}
        onProfileUpdated={(updated) => {
          queryClient.setQueryData(['profile', resolvedUsername], updated);
        }}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800/80 mb-4">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'posts'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Grid className="w-4 h-4" /> Posts ({profileUser.postsCount})
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'media'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Media
        </button>

        <button
          onClick={() => setActiveTab('likes')}
          className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'likes'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Heart className="w-4 h-4" /> Likes
        </button>

        {isSelf && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'saved'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Saved
          </button>
        )}
      </div>

      {/* Posts Grid / List */}
      <div className="space-y-4">
        {isPostsLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : displayedPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No {activeTab} to show yet.
          </div>
        ) : (
          displayedPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostDeleted={() => {
                queryClient.invalidateQueries({
                  queryKey: ['profile-posts', profileUser._id],
                });
                queryClient.invalidateQueries({
                  queryKey: ['profile', resolvedUsername],
                });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
