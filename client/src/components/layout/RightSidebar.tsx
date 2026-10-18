import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Sparkles, Check } from 'lucide-react';
import { api } from '../../api/client';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

export const RightSidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ users: User[]; hashtags: any[] }>({
    users: [],
    hashtags: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [trending, setTrending] = useState<{ tag: string; count: number }[]>([]);
  const [suggested, setSuggested] = useState<User[]>([]);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Load trending and suggested accounts
  useEffect(() => {
    const fetchWidgetsData = async () => {
      try {
        const [trendRes, suggestRes] = await Promise.all([
          api.get('/search/trending'),
          api.get('/search/suggested'),
        ]);

        if (trendRes.data.success) {
          setTrending(trendRes.data.data.slice(0, 5));
        }
        if (suggestRes.data.success) {
          setSuggested(suggestRes.data.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load sidebar widgets:', err);
      }
    };

    fetchWidgetsData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ users: [], hashtags: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchTerm)}`);
        if (res.data.success) {
          setSearchResults(res.data.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFollowToggle = async (userId: string) => {
    const isCurrentlyFollowed = followedMap[userId];
    try {
      if (isCurrentlyFollowed) {
        await api.post(`/users/${userId}/unfollow`);
        setFollowedMap((prev) => ({ ...prev, [userId]: false }));
      } else {
        await api.post(`/users/${userId}/follow`);
        setFollowedMap((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  return (
    <aside className="hidden xl:block w-80 h-screen sticky top-0 p-5 space-y-6 overflow-y-auto no-scrollbar border-l border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0b0f19]/50 backdrop-blur-sm">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users or #tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#111827] border border-transparent focus:border-brand-500/50 focus:bg-white dark:focus:bg-[#111827] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        {/* Live Search Dropdown */}
        {searchTerm.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95">
            {isSearching ? (
              <p className="text-xs text-slate-400 text-center py-2">Searching...</p>
            ) : searchResults.users.length === 0 && searchResults.hashtags.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">No results found</p>
            ) : (
              <>
                {searchResults.users.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">People</p>
                    <div className="space-y-1">
                      {searchResults.users.slice(0, 4).map((u) => (
                        <button
                          key={u._id}
                          onClick={() => {
                            setSearchTerm('');
                            navigate(`/profile/${u.username}`);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                        >
                          <Avatar src={u.avatar} alt={u.displayName} size="sm" isVerified={u.isVerified} />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{u.displayName}</p>
                            <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.hashtags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hashtags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {searchResults.hashtags.map((h: any) => (
                        <button
                          key={h.tag}
                          onClick={() => {
                            setSearchTerm('');
                            navigate(`/explore?tag=${h.tag}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:bg-brand-100 transition-colors"
                        >
                          #{h.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Suggested Creators */}
      {suggested.length > 0 && (
        <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Suggested Creators
            </h3>
          </div>
          <div className="space-y-2.5">
            {suggested.map((user) => {
              const isFollowed = followedMap[user._id];
              return (
                <div key={user._id} className="flex items-center justify-between gap-2">
                  <NavLink
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-2.5 overflow-hidden flex-1 group"
                  >
                    <Avatar src={user.avatar} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-500 transition-colors">
                        {user.displayName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                    </div>
                  </NavLink>
                  <Button
                    size="sm"
                    variant={isFollowed ? 'secondary' : 'primary'}
                    onClick={() => handleFollowToggle(user._id)}
                    className="!py-1 !px-2.5 !text-[11px]"
                  >
                    {isFollowed ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" /> Following
                      </span>
                    ) : (
                      'Follow'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending Topics */}
      {trending.length > 0 && (
        <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Trending for You
            </h3>
          </div>
          <div className="space-y-2">
            {trending.map((item) => (
              <NavLink
                key={item.tag}
                to={`/explore?tag=${item.tag}`}
                className="block p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 transition-colors">
                    #{item.tag}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.count} {item.count === 1 ? 'post' : 'posts'}
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-[11px] text-slate-400 space-y-2 px-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="hover:underline cursor-pointer">About</span>
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="hover:underline cursor-pointer">Terms of Service</span>
          <span className="hover:underline cursor-pointer">Security</span>
          <span className="hover:underline cursor-pointer">API Status</span>
        </div>
        <p>© 2026 SocialSphere Inc. Built with REA architecture.</p>
      </footer>
    </aside>
  );
};
