import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Send, Image, Phone, Video, ArrowLeft, Loader2,
  Trash2, Pencil, X, Check, MoreVertical, Download,
} from 'lucide-react';
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

interface ContextMenu {
  msgId: string;
  x: number;
  y: number;
  isMe: boolean;
  content: string;
  mediaUrl?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, recipient, onBack }) => {
  const { user } = useAuth();
  const { socket, isOnline, sendTyping } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [callToast, setCallToast] = useState<string | null>(null);

  // Load message history
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/messages/conversations/${conversationId}/messages`);
        if (isMounted && res.data.success) {
          setMessages(res.data.data);
          api.post(`/messages/conversations/${conversationId}/read`).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchMessages();
    return () => { isMounted = false; };
  }, [conversationId]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.conversation === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        api.post(`/messages/conversations/${conversationId}/read`).catch(() => {});
      }
    };
    const handleTyping = ({ conversationId: convId, userId, isTyping }: {
      conversationId: string; userId: string; isTyping: boolean;
    }) => {
      if (convId === conversationId && userId === recipient._id) {
        setIsRecipientTyping(isTyping);
      }
    };
    const handleMsgDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };
    const handleMsgEdited = ({ messageId, content }: { messageId: string; content: string }) => {
      setMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, content, isEdited: true } : m)
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('message_deleted', handleMsgDeleted);
    socket.on('message_edited', handleMsgEdited);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('message_deleted', handleMsgDeleted);
      socket.off('message_edited', handleMsgEdited);
    };
  }, [socket, conversationId, recipient._id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecipientTyping]);

  // Close context menu on outside click
  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingMsgId) editInputRef.current?.focus();
  }, [editingMsgId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(conversationId, true);
    const t = setTimeout(() => sendTyping(conversationId, false), 1500);
    return () => clearTimeout(t);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const content = inputText.trim();
    setInputText('');
    sendTyping(conversationId, false);
    setIsSending(true);
    try {
      const res = await api.post(`/messages/conversations/${conversationId}/messages`, { content });
      if (res.data.success) {
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
        const res = await api.post(`/messages/conversations/${conversationId}/messages`, {
          content: '',
          media: { url: uploadRes.data.data.url, type: 'image' },
        });
        if (res.data.success) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === res.data.data._id)) return prev;
            return [...prev, res.data.data];
          });
        }
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, msg: Message) => {
      e.preventDefault();
      e.stopPropagation();
      const isMe = msg.sender._id === user?._id;
      setContextMenu({
        msgId: msg._id,
        x: e.clientX,
        y: e.clientY,
        isMe,
        content: msg.content || '',
        mediaUrl: msg.media?.url,
      });
    },
    [user?._id]
  );

  const handleDeleteMessage = async (forEveryone: boolean) => {
    if (!contextMenu) return;
    const { msgId } = contextMenu;
    setContextMenu(null);
    try {
      await api.delete(`/messages/${msgId}`, { data: { forEveryone } });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleStartEdit = () => {
    if (!contextMenu) return;
    setEditingMsgId(contextMenu.msgId);
    setEditText(contextMenu.content);
    setContextMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMsgId || !editText.trim()) return;
    try {
      await api.patch(`/messages/${editingMsgId}`, { content: editText.trim() });
      setMessages((prev) =>
        prev.map((m) =>
          m._id === editingMsgId ? { ...m, content: editText.trim(), isEdited: true } : m
        )
      );
    } catch (err) {
      console.error('Edit failed:', err);
    } finally {
      setEditingMsgId(null);
      setEditText('');
    }
  };

  const handleDownloadMedia = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image';
    a.target = '_blank';
    a.click();
    setContextMenu(null);
  };

  const showCallToast = (type: 'voice' | 'video') => {
    setCallToast(`${type === 'voice' ? 'Voice' : 'Video'} calling is coming soon! 🎙️`);
    setTimeout(() => setCallToast(null), 3000);
  };

  const online = isOnline(recipient._id);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-[#0b0f19]/50 relative">
      {/* Call Toast */}
      {callToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-medium px-4 py-2.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2">
          {callToast}
        </div>
      )}

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
            <Avatar src={recipient.avatar} alt={recipient.displayName} size="sm" isOnline={online} isVerified={recipient.isVerified} />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{recipient.displayName}</p>
              <p className="text-[10px] text-slate-400">{online ? 'Active now' : 'Offline'}</p>
            </div>
          </NavLink>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => showCallToast('voice')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-500 transition-colors"
            title="Voice Call (Coming Soon)"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => showCallToast('video')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-500 transition-colors"
            title="Video Call (Coming Soon)"
          >
            <Video className="w-4 h-4" />
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
            <p className="text-[11px] text-slate-400">Messages are sent in real-time.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user?._id;
            const isEditing = editingMsgId === msg._id;

            return (
              <div key={msg._id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <Avatar src={recipient.avatar} alt={recipient.displayName} size="xs" />}

                <div
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                  className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-sm cursor-pointer select-text ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/80 rounded-bl-none'
                  }`}
                >
                  {/* Media */}
                  {msg.media && (
                    <div className="relative group/media mb-1.5">
                      <img
                        src={msg.media.url}
                        alt="Attachment"
                        className="rounded-xl max-h-60 w-full object-cover"
                      />
                      <button
                        onClick={() => handleDownloadMedia(msg.media!.url)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover/media:opacity-100 transition-opacity"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Edit inline */}
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') { setEditingMsgId(null); setEditText(''); }
                        }}
                        className="flex-1 bg-white/20 rounded-lg px-2 py-1 text-xs outline-none border border-white/40"
                      />
                      <button onClick={handleSaveEdit} className="p-1 rounded-lg hover:bg-white/20">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditingMsgId(null); setEditText(''); }} className="p-1 rounded-lg hover:bg-white/20">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    msg.content && (
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                        {(msg as any).isEdited && (
                          <span className={`text-[9px] ml-1 ${isMe ? 'text-white/50' : 'text-slate-400'}`}>(edited)</span>
                        )}
                      </p>
                    )
                  )}

                  <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <div className="flex gap-1 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl px-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 min-w-[160px] animate-in fade-in zoom-in-95"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 180) }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isMe && contextMenu.content && (
            <button
              onClick={handleStartEdit}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-brand-500" /> Edit Message
            </button>
          )}
          {contextMenu.mediaUrl && (
            <button
              onClick={() => handleDownloadMedia(contextMenu.mediaUrl!)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" /> Download Image
            </button>
          )}
          {contextMenu.isMe && (
            <>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <button
                onClick={() => handleDeleteMessage(false)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-500" /> Delete for Me
              </button>
              <button
                onClick={() => handleDeleteMessage(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete for Everyone
              </button>
            </>
          )}
          {!contextMenu.isMe && (
            <>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <button
                onClick={() => handleDeleteMessage(false)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete for Me
              </button>
            </>
          )}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white dark:bg-[#0b0f19] border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2"
      >
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />

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
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any); } }}
          placeholder={`Message ${recipient.displayName}…`}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#111827] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl disabled:opacity-40 shadow-sm transition-colors"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
