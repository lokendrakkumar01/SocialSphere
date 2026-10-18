import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Send, Image, MoreVertical, Phone, Video, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { Message, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';

interface ChatWindowProps {
  conversationId: string;
  recipient: User;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, recipient, onBack }) => {
  const { user } = useAuth();
  const { socket, isOnline, sendTyping } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  // Load message history
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/messages/conversations/${conversationId}/messages`);
        if (isMounted && res.data.success) {
          setMessages(res.data.data);
          // Mark conversation read
          api.post(`/messages/conversations/${conversationId}/read`).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMessages();
    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // Real-time socket events for conversation
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.conversation === conversationId) {
        setMessages((prev) => [...prev, newMsg]);
        api.post(`/messages/conversations/${conversationId}/read`).catch(() => {});
      }
    };

    const handleTyping = ({
      conversationId: convId,
      userId,
      isTyping,
    }: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (convId === conversationId && userId === recipient._id) {
        setIsRecipientTyping(isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, conversationId, recipient._id]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecipientTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(conversationId, true);

    // Debounce typing stop
    const timeout = setTimeout(() => {
      sendTyping(conversationId, false);
    }, 1500);

    return () => clearTimeout(timeout);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');
    sendTyping(conversationId, false);
    setIsSending(true);

    try {
      const res = await api.post(`/messages/conversations/${conversationId}/messages`, {
        content,
      });
      if (res.data.success) {
        // Message will also arrive via socket, or append if not already present
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.data._id)) return prev;
          return [...prev, res.data.data];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data.success) {
        await api.post(`/messages/conversations/${conversationId}/messages`, {
          content: '',
          media: {
            url: uploadRes.data.data.url,
            type: 'image',
          },
        });
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const online = isOnline(recipient._id);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-[#0b0f19]/50">
      {/* Chat Header */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <NavLink to={`/profile/${recipient.username}`} className="flex items-center gap-2.5">
            <Avatar
              src={recipient.avatar}
              alt={recipient.displayName}
              size="sm"
              isOnline={online}
              isVerified={recipient.isVerified}
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {recipient.displayName}
              </p>
              <p className="text-[10px] text-slate-400">
                {online ? 'Active now' : 'Offline'}
              </p>
            </div>
          </NavLink>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Start a conversation with {recipient.displayName}
            </p>
            <p className="text-[11px] text-slate-400">
              Direct messages are transmitted securely in real-time.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user?._id;

            return (
              <div
                key={msg._id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Avatar src={recipient.avatar} alt={recipient.displayName} size="xs" />
                )}

                <div
                  className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-sm ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/80 rounded-bl-none'
                  }`}
                >
                  {/* Media */}
                  {msg.media && (
                    <img
                      src={msg.media.url}
                      alt="Attachment"
                      className="rounded-xl max-h-60 w-full object-cover mb-1.5"
                    />
                  )}

                  {/* Text */}
                  {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                  <p
                    className={`text-[9px] mt-1 text-right ${
                      isMe ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isRecipientTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
            <Avatar src={recipient.avatar} alt={recipient.displayName} size="xs" />
            <span>{recipient.displayName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white dark:bg-[#0b0f19] border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleMediaUpload}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-brand-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Image className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Message ${recipient.displayName}...`}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#111827] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl disabled:opacity-40 shadow-sm transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
