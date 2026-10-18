import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Link as LinkIcon,
  MessageSquare,
  Edit3,
  ShieldCheck,
  Check,
  UserPlus,
  UserCheck,
  Ban,
} from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { EditProfileModal } from './EditProfileModal';
import { FollowersModal } from './FollowersModal';

interface ProfileHeaderProps {
  profileUser: User;
  onProfileUpdated?: (updated: User) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileUser, onProfileUpdated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSelf = user?._id === profileUser._id;
  const [isFollowing, setIsFollowing] = useState(!!profileUser.isFollowing);
  const [followersCount, setFollowersCount] = useState(profileUser.followersCount);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following' | null>(null);

  const handleFollowToggle = async () => {
    const prev = isFollowing;
    const prevCount = followersCount;

    setIsFollowing(!prev);
    setFollowersCount(prev ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (prev) {
        await api.post(`/users/${profileUser._id}/unfollow`);
      } else {
        await api.post(`/users/${profileUser._id}/follow`);
      }
    } catch {
      setIsFollowing(prev);
      setFollowersCount(prevCount);
    }
  };

  const handleStartMessage = async () => {
    try {
      const res = await api.post('/messages/conversations', {
        participantId: profileUser._id,
      });
      if (res.data.success) {
        navigate(`/messages?conversationId=${res.data.data._id}`);
      }
    } catch (err) {
      console.error('Failed to open message conversation:', err);
    }
  };

  const formattedDate = new Date(profileUser.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden mb-6 shadow-sm">
        {/* Cover Photo */}
        <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 relative overflow-hidden">
          {profileUser.coverPhoto ? (
            <img
              src={profileUser.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-brand-600 via-indigo-700 to-purple-800 opacity-90" />
          )}
        </div>

        {/* Profile Content */}
        <div className="px-5 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
            {/* Avatar */}
            <div className="p-1.5 bg-white dark:bg-[#111827] rounded-full inline-block">
              <Avatar
                src={profileUser.avatar}
                alt={profileUser.displayName}
                size="xl"
                isVerified={profileUser.isVerified}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isSelf ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(true)}
                  leftIcon={<Edit3 className="w-4 h-4" />}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handleFollowToggle}
                    leftIcon={isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartMessage}
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {profileUser.displayName}
                </h2>
                {profileUser.role === 'admin' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    Admin
                  </span>
                )}
                {profileUser.role === 'moderator' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    Moderator
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">@{profileUser.username}</p>
            </div>

            {profileUser.bio && (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-w-xl">
                {profileUser.bio}
              </p>
            )}

            {/* Meta details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1">
              {profileUser.website && (
                <a
                  href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-brand-500 hover:underline"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formattedDate}</span>
              </div>
            </div>

            {/* Counters */}
            <div className="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">
                  {profileUser.postsCount}
                </span>
                <span className="text-slate-400">Posts</span>
              </div>
              <button
                onClick={() => setFollowersModalType('followers')}
                className="hover:underline"
              >
                <span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">
                  {followersCount}
                </span>
                <span className="text-slate-400">Followers</span>
              </button>
              <button
                onClick={() => setFollowersModalType('following')}
                className="hover:underline"
              >
                <span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">
                  {profileUser.followingCount}
                </span>
                <span className="text-slate-400">Following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSaved={(updated) => {
            if (onProfileUpdated) onProfileUpdated(updated);
          }}
        />
      )}

      {/* Followers / Following Modal */}
      {followersModalType && (
        <FollowersModal
          userId={profileUser._id}
          type={followersModalType}
          isOpen={!!followersModalType}
          onClose={() => setFollowersModalType(null)}
        />
      )}
    </>
  );
};
