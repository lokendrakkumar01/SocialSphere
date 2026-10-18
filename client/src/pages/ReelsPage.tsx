import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film } from 'lucide-react';
import { api } from '../api/client';
import { Post } from '../types';
import { ShortVideoFeed } from '../components/reels/ShortVideoFeed';
import { Skeleton } from '../components/common/Skeleton';

export const ReelsPage: React.FC = () => {
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['reels'],
    queryFn: async () => {
      const res = await api.get('/posts/explore');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Film className="w-5 h-5 text-brand-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Reels & Short Video
        </h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-6 py-6">
          <Skeleton className="w-full max-w-sm h-[70vh] rounded-3xl" />
        </div>
      ) : (
        <ShortVideoFeed posts={posts} />
      )}
    </div>
  );
};
