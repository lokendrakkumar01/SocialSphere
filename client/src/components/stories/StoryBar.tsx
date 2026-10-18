import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../../api/client';
import { StoryGroup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { StoryViewerModal } from './StoryViewerModal';
import { CreateStoryModal } from './CreateStoryModal';

export const StoryBar: React.FC = () => {
  const { user } = useAuth();
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: storyGroups = [], isLoading } = useQuery<StoryGroup[]>({
    queryKey: ['stories'],
    queryFn: async () => {
      const res = await api.get('/stories/feed');
      return res.data.data;
    },
  });

  return (
    <>
      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-2 px-1 mb-4">
        {/* Current User: Add Story Bubble */}
        <div
          onClick={() => setIsCreateOpen(true)}
          className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
        >
          <div className="relative">
            <Avatar src={user?.avatar} alt={user?.displayName} size="lg" />
            <div className="absolute bottom-0 right-0 p-1 bg-brand-500 text-white rounded-full ring-2 ring-white dark:ring-[#0b0f19] group-hover:scale-110 transition-transform">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 w-16 text-center truncate">
            Your Story
          </span>
        </div>

        {/* Story Groups */}
        {storyGroups.map((group, index) => {
          if (group.isSelf && group.stories.length === 0) return null;

          return (
            <div
              key={group.author._id}
              onClick={() => setSelectedGroupIndex(index)}
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
            >
              <div
                className={`p-0.5 rounded-full transition-transform group-hover:scale-105 ${
                  group.hasUnviewed
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div className="p-0.5 bg-white dark:bg-[#0b0f19] rounded-full">
                  <Avatar src={group.author.avatar} alt={group.author.displayName} size="lg" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 w-16 text-center truncate">
                {group.author.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      {selectedGroupIndex !== null && (
        <StoryViewerModal
          groups={storyGroups}
          initialGroupIndex={selectedGroupIndex}
          isOpen={selectedGroupIndex !== null}
          onClose={() => setSelectedGroupIndex(null)}
        />
      )}

      {/* Create Story Modal */}
      <CreateStoryModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
};
