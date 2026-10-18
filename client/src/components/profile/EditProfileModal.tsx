import React, { useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [coverPhoto, setCoverPhoto] = useState(user?.coverPhoto || '');
  const [isPrivate, setIsPrivate] = useState(!!user?.isPrivate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.patch('/users/profile', {
        displayName,
        bio,
        website,
        avatar,
        coverPhoto,
        isPrivate,
      });

      if (res.data.success) {
        updateUser(res.data.data);
        onSaved(res.data.data);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the world about yourself..."
            maxLength={250}
            className="w-full h-24 p-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <div className="flex justify-end">
            <span className="text-[10px] text-slate-400">{bio.length}/250</span>
          </div>
        </div>

        <Input
          label="Website"
          type="url"
          placeholder="https://example.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />

        <Input
          label="Avatar Image URL"
          placeholder="https://images.unsplash.com/..."
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />

        <Input
          label="Cover Photo URL"
          placeholder="https://images.unsplash.com/..."
          value={coverPhoto}
          onChange={(e) => setCoverPhoto(e.target.value)}
        />

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Private Account</p>
            <p className="text-[11px] text-slate-400">Only approved followers can view your posts</p>
          </div>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
          />
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
