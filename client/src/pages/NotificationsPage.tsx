import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Repeat,
  AtSign,
  CheckCheck,
  Check,
} from 'lucide-react';
import { api } from '../api/client';
import { NotificationItem } from '../types';
import { useSocket } from '../context/SocketContext';
import { Avatar } from '../components/common/Avatar';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [filter, setFilter] = useState<'all' | 'likes' | 'comments' | 'follows'>('all');

  const { data, isLoading } = useQuery<{ data: NotificationItem[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
  });

  // Listen for real-time notification
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  const notifications = data?.data || [];

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Mark single read failed:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-brand-500" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'repost':
        return <Repeat className="w-4 h-4 text-emerald-500" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-500" />;
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'likes') return n.type === 'like';
    if (filter === 'comments') return n.type === 'comment';
    if (filter === 'follows') return n.type === 'follow' || n.type === 'follow_request';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notifications</h2>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
        {(['all', 'likes', 'comments', 'follows'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
              filter === tab
                ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-10">Loading notifications...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs text-slate-400">No notifications to display</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              onClick={() => handleMarkSingleRead(item._id)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                item.isRead
                  ? 'bg-white dark:bg-[#111827] border-slate-200/60 dark:border-slate-800/60'
                  : 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-200/60 dark:border-brand-900/40'
              }`}
            >
              <div className="mt-1">{getIcon(item.type)}</div>

              {item.sender && (
                <NavLink
                  to={`/profile/${item.sender.username}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar src={item.sender.avatar} alt={item.sender.displayName} size="sm" />
                </NavLink>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                  {item.sender && (
                    <span className="font-bold mr-1">{item.sender.displayName}</span>
                  )}
                  <span>{item.message}</span>
                </p>

                {item.post && (
                  <p className="text-[11px] text-slate-400 truncate mt-1 italic">
                    "{item.post.content}"
                  </p>
                )}

                <span className="text-[10px] text-slate-400 mt-1 block">
                  {new Date(item.createdAt).toLocaleDateString()} at{' '}
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-brand-500 self-center flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
