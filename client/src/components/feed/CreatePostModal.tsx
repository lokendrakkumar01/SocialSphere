import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Image, Video, Globe, Users, Lock, X, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { MediaItem } from '../../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setMediaList((prev) => [
          ...prev,
          {
            url: res.data.data.url,
            type: res.data.data.type,
          },
        ]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaList.length === 0) {
      setError('Please add text or media to your post');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/posts', {
        content: content.trim(),
        media: mediaList,
        visibility,
      });

      // Reset and close
      setContent('');
      setMediaList([]);
      setVisibility('public');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Info & Visibility */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} alt={user?.displayName} size="md" isVerified={user?.isVerified} />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <select
                  value={visibility}
                  onChange={(e: any) => setVisibility(e.target.value)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-0.5 border-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="public">🌍 Public</option>
                  <option value="followers">👥 Followers Only</option>
                  <option value="private">🔒 Only Me</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening? Share ideas, updates, or #hashtags..."
            className="w-full h-32 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none text-base leading-relaxed"
            maxLength={2000}
          />
          <div className="flex justify-end">
            <span className="text-[11px] text-slate-400">{content.length}/2000</span>
          </div>
        </div>

        {/* Media Previews */}
        {mediaList.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaList.map((item, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-36 object-cover" controls />
                ) : (
                  <img src={item.url} alt="Attachment" className="w-full h-36 object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute top-2 right-2 p-1 bg-slate-950/70 text-white rounded-full hover:bg-slate-950"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-5 h-5" />}
              <span>Photo / Video</span>
            </button>
          </div>

          <Button type="submit" isLoading={isSubmitting} disabled={isUploading || (!content.trim() && mediaList.length === 0)}>
            Publish
          </Button>
        </div>
      </form>
    </Modal>
  );
};
