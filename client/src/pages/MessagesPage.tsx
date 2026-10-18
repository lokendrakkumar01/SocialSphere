import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus } from 'lucide-react';
import { api } from '../api/client';
import { Conversation, User } from '../types';
import { ConversationList } from '../components/messages/ConversationList';
import { ChatWindow } from '../components/messages/ChatWindow';
import { Modal } from '../components/common/Modal';
import { Avatar } from '../components/common/Avatar';

export const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConvId = searchParams.get('conversationId');

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/messages/conversations');
      return res.data.data;
    },
    refetchInterval: 10000, // poll fallback in addition to socket events
  });

  const { data: searchedUsers = [] } = useQuery<User[]>({
    queryKey: ['search-users-dm', userSearchTerm],
    queryFn: async () => {
      if (!userSearchTerm.trim()) {
        const res = await api.get('/search/suggested');
        return res.data.data;
      }
      const res = await api.get(`/search?q=${encodeURIComponent(userSearchTerm)}`);
      return res.data.data.users;
    },
  });

  const activeConversation = conversations.find((c) => c._id === selectedConvId);

  const handleStartChatWithUser = async (targetUser: User) => {
    try {
      const res = await api.post('/messages/conversations', {
        participantId: targetUser._id,
      });
      if (res.data.success) {
        setIsNewChatOpen(false);
        await refetchConversations();
        setSearchParams({ conversationId: res.data.data._id });
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm flex -mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
      {/* Sidebar: Visible on desktop or when no conversation is selected on mobile */}
      <div
        className={`${
          selectedConvId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 flex-shrink-0 h-full`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={selectedConvId}
          onSelectConversation={(id) => setSearchParams({ conversationId: id })}
          onOpenNewChat={() => setIsNewChatOpen(true)}
        />
      </div>

      {/* Chat Area */}
      <div
        className={`${
          selectedConvId ? 'flex' : 'hidden md:flex'
        } flex-1 h-full flex-col`}
      >
        {activeConversation && activeConversation.otherParticipant ? (
          <ChatWindow
            conversationId={activeConversation._id}
            recipient={activeConversation.otherParticipant}
            onBack={() => setSearchParams({})}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/50 text-brand-500 flex items-center justify-center">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Your Direct Messages
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Send private messages, share photos, and connect in real-time.
              </p>
            </div>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              Start a Conversation
            </button>
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      {isNewChatOpen && (
        <Modal
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
          title="New Message"
          maxWidth="sm"
        >
          <div className="space-y-3">
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search people..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-brand-500"
            />

            <div className="max-h-64 overflow-y-auto space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Suggested
              </p>
              {searchedUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleStartChatWithUser(u)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Avatar src={u.avatar} alt={u.displayName} size="sm" isVerified={u.isVerified} />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{u.displayName}</p>
                    <p className="text-[10px] text-slate-400 truncate">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
