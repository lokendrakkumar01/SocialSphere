import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Conversation } from '../../types';
import { Avatar } from '../common/Avatar';
import { useSocket } from '../../context/SocketContext';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isOnline } = useSocket();

  const filteredConversations = conversations.filter((c) => {
    const name = c.otherParticipant?.displayName || '';
    const username = c.otherParticipant?.username || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="w-full md:w-80 border-r border-slate-200/80 dark:border-slate-800/80 h-full flex flex-col bg-white dark:bg-[#0b0f19]">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Messages</h2>
        <button
          onClick={onOpenNewChat}
          className="p-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-400 transition-colors"
          title="New Message"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#111827] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
        {filteredConversations.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No conversations found</p>
        ) : (
          filteredConversations.map((conv) => {
            const participant = conv.otherParticipant;
            if (!participant) return null;

            const isActive = conv._id === activeConversationId;
            const online = isOnline(participant._id);

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Avatar
                  src={participant.avatar}
                  alt={participant.displayName}
                  size="md"
                  isOnline={online}
                  isVerified={participant.isVerified}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {participant.displayName}
                    </p>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {conv.lastMessage?.content || 'Started a conversation'}
                    </p>
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
