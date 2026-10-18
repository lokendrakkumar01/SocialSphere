import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Image, Video, Upload, X, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
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
        setMediaUrl(res.data.data.url);
        setMediaType(res.data.data.type);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      setError('Please provide an image or video for your story');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/stories', {
        mediaUrl,
        mediaType,
        caption: caption.trim(),
      });

      setMediaUrl('');
      setCaption('');
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Your Story" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Upload area or Preview */}
        {mediaUrl ? (
          <div className="relative rounded-2xl overflow-hidden bg-black h-80 flex items-center justify-center border border-slate-200 dark:border-slate-800">
            {mediaType === 'video' ? (
              <video src={mediaUrl} controls className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} alt="Story preview" className="w-full h-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => setMediaUrl('')}
              className="absolute top-3 right-3 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500 dark:hover:border-brand-500 transition-colors bg-slate-50 dark:bg-slate-900/40"
          >
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center">
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isUploading ? 'Uploading media...' : 'Click to upload photo or video'}
            </p>
            <p className="text-[10px] text-slate-400">Story will remain visible for 24 hours</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Caption */}
        <div>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            maxLength={150}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSubmitting} disabled={!mediaUrl || isUploading}>
            Share to Story
          </Button>
        </div>
      </form>
    </Modal>
  );
};
