import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { User } from '../../types';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';

interface FollowersModalProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  userId,
  type,
  isOpen,
  onClose,
}) => {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['social-graph', userId, type],
    queryFn: async () => {
      const endpoint = type === 'followers' ? `/users/${userId}/followers` : `/users/${userId}/following`;
      const res = await api.get(endpoint);
      return res.data.data;
    },
    enabled: isOpen,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'followers' ? 'Followers' : 'Following'}
      maxWidth="sm"
    >
      <div className="max-h-80 overflow-y-auto space-y-3 py-1">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-6">Loading {type}...</p>
        ) : users.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No {type} yet.</p>
        ) : (
          users.map((u) => (
            <NavLink
              key={u._id}
              to={`/profile/${u.username}`}
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Avatar src={u.avatar} alt={u.displayName} size="sm" isVerified={u.isVerified} />
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {u.displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
              </div>
            </NavLink>
          ))
        )}
      </div>
    </Modal>
  );
};
