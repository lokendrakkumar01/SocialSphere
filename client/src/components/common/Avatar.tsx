import React from 'react';
import { CheckCircle } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  isVerified?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-24 h-24 text-xl',
};

const badgeMap = {
  xs: 'w-1.5 h-1.5 right-0 bottom-0',
  sm: 'w-2 h-2 right-0 bottom-0',
  md: 'w-2.5 h-2.5 right-0 bottom-0',
  lg: 'w-3.5 h-3.5 right-0.5 bottom-0.5',
  xl: 'w-5 h-5 right-1 bottom-1',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User',
  size = 'md',
  isOnline = false,
  isVerified = false,
  className = '',
}) => {
  const fallbackLetter = alt ? alt.charAt(0).toUpperCase() : '?';

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-semibold flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-800`}
        >
          {fallbackLetter}
        </div>
      )}

      {isOnline && (
        <span
          className={`absolute ${badgeMap[size]} bg-emerald-500 border-2 border-white dark:border-[#0b0f19] rounded-full`}
          title="Online"
        />
      )}

      {isVerified && (
        <span className="absolute -bottom-1 -right-1" title="Verified">
          <CheckCircle className="text-brand-500 fill-white dark:fill-[#0b0f19] w-4 h-4" />
        </span>
      )}
    </div>
  );
};
