import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800/80 rounded-lg ${className}`}
    />
  );
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="w-32 h-3.5" />
          <Skeleton className="w-20 h-2.5" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-4/5 h-3" />
      </div>
      <Skeleton className="w-full h-64 rounded-xl mb-4" />
      <div className="flex justify-between pt-2">
        <Skeleton className="w-16 h-6" />
        <Skeleton className="w-16 h-6" />
        <Skeleton className="w-16 h-6" />
      </div>
    </div>
  );
};
