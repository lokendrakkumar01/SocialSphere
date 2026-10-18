import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { StoryGroup, Story } from '../../types';
import { api } from '../../api/client';
import { Avatar } from '../common/Avatar';

interface StoryViewerModalProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const STORY_DURATION_MS = 5000;

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  groups,
  initialGroupIndex,
  isOpen,
  onClose,
}) => {
  const [currentGroupIdx, setCurrentGroupIdx] = useState(initialGroupIndex);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');

  const currentGroup = groups[currentGroupIdx];
  const currentStory: Story | undefined = currentGroup?.stories[currentStoryIdx];

  // Mark story as viewed
  useEffect(() => {
    if (currentStory) {
      api.post(`/stories/${currentStory._id}/view`).catch(() => {});
    }
  }, [currentStory?._id]);

  // Story Timer
  useEffect(() => {
    if (!isOpen || isPaused || !currentStory) return;

    const interval = 50;
    const step = (interval / STORY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentStoryIdx, currentGroupIdx]);

  const handleNext = () => {
    setProgress(0);
    if (currentStoryIdx < currentGroup.stories.length - 1) {
      setCurrentStoryIdx((prev) => prev + 1);
    } else if (currentGroupIdx < groups.length - 1) {
      setCurrentGroupIdx((prev) => prev + 1);
      setCurrentStoryIdx(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx((prev) => prev - 1);
    } else if (currentGroupIdx > 0) {
      setCurrentGroupIdx((prev) => prev - 1);
      setCurrentStoryIdx(groups[currentGroupIdx - 1].stories.length - 1);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentGroup) return;

    try {
      // Start or fetch conversation with story author
      const convRes = await api.post('/messages/conversations', {
        participantId: currentGroup.author._id,
      });
      if (convRes.data.success) {
        await api.post(`/messages/conversations/${convRes.data.data._id}/messages`, {
          content: `Replied to your story: "${replyText.trim()}"`,
        });
        setReplyText('');
        alert('Reply sent via Direct Message!');
      }
    } catch (err) {
      console.error('Failed to send story reply:', err);
    }
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-50 p-2 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev / Next controls */}
      <button
        onClick={handlePrev}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors z-40"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors z-40"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Story Container */}
      <div
        className="relative w-full max-w-sm h-[90vh] max-h-[750px] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {currentGroup.stories.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx === currentStoryIdx
                      ? `${progress}%`
                      : idx < currentStoryIdx
                      ? '100%'
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center gap-2.5">
            <Avatar src={currentGroup.author.avatar} alt={currentGroup.author.displayName} size="sm" isVerified={currentGroup.author.isVerified} />
            <div>
              <p className="text-xs font-bold leading-tight">{currentGroup.author.displayName}</p>
              <p className="text-[10px] text-white/80">@{currentGroup.author.username}</p>
            </div>
          </div>
        </div>

        {/* Story Media (Image or Video) */}
        <div className="w-full h-full flex items-center justify-center bg-black relative">
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}

          {/* Tap navigation hit areas */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2/3 z-20"
            onClick={handleNext}
          />
        </div>

        {/* Caption & Reply Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-30 space-y-3">
          {currentStory.caption && (
            <p className="text-xs text-white drop-shadow font-medium">
              {currentStory.caption}
            </p>
          )}

          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentGroup.author.displayName}...`}
              className="flex-1 px-3 py-2 rounded-xl bg-white/20 border border-white/20 text-xs text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-white"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2 bg-white text-slate-900 rounded-xl hover:bg-white/90 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
