import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFeed,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowStats,
  likeWorkout,
  unlikeWorkout,
} from '../services/api';
import type { FeedItem, SocialUser, FollowStats } from '../types';
import { Search, Heart, Clock, Flame, Dumbbell, UserPlus, UserCheck, ChevronLeft, Loader2 } from 'lucide-react';

function FeedSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="skeleton w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-2.5 w-16" />
        </div>
        <div className="skeleton w-8 h-8 rounded-xl" />
      </div>
      <div className="px-4 pb-3 space-y-2">
        <div className="skeleton h-3.5 w-40" />
        <div className="skeleton h-3 w-full" />
        <div className="flex gap-4 mt-2">
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-3 w-14" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
      <div className="border-t border-gray-50 px-4 py-2.5">
        <div className="skeleton h-3 w-14" />
      </div>
    </div>
  );
}

function UserRowSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
      <div className="skeleton w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3 w-32" />
      </div>
      <div className="skeleton h-7 w-20 rounded-xl" />
    </div>
  );
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-rose-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials || '?'}
    </div>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'feed' | 'find'>('feed');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [stats, setStats] = useState<FollowStats | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SocialUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());

  const [likingInProgress, setLikingInProgress] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeed();
    getFollowStats().then(setStats).catch(() => {});
  }, []);

  async function loadFeed() {
    setFeedLoading(true);
    try {
      const data = await getFeed(30);
      setFeed(data);
    } catch {
      setFeed([]);
    }
    setFeedLoading(false);
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const results = await searchUsers(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setSearchLoading(false);
  }

  async function handleFollow(userId: string, isFollowing: boolean) {
    setFollowingInProgress((prev) => new Set([...prev, userId]));
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_following: !isFollowing } : u))
      );
      const updated = await getFollowStats();
      setStats(updated);
    } catch {}
    setFollowingInProgress((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }

  async function handleLike(item: FeedItem) {
    if (likingInProgress.has(item.id)) return;
    setLikingInProgress((prev) => new Set([...prev, item.id]));

    const wasLiked = item.liked_by_me;
    const originalCount = item.likes_count;

    setFeed((prev) =>
      prev.map((f) =>
        f.id === item.id
          ? { ...f, liked_by_me: !wasLiked, likes_count: originalCount + (wasLiked ? -1 : 1) }
          : f
      )
    );

    try {
      if (wasLiked) {
        await unlikeWorkout(item.id);
      } else {
        await likeWorkout(item.id);
      }
    } catch {
      setFeed((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, liked_by_me: wasLiked, likes_count: originalCount }
            : f
        )
      );
    }

    setLikingInProgress((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  }

  return (
    <div className="page-enter min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft size={22} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Social Feed</h1>
            {stats && (
              <div className="ml-auto flex gap-3 text-xs text-gray-500">
                <span><span className="font-semibold text-gray-900">{stats.followers}</span> followers</span>
                <span><span className="font-semibold text-gray-900">{stats.following}</span> following</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setTab('feed')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'feed' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setTab('find')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'find' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Find Friends
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">

        {/* ── Feed tab ── */}
        {tab === 'feed' && (
          <>
            {feedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <FeedSkeleton key={i} />)}
              </div>
            ) : feed.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">👥</div>
                <p className="text-sm font-medium text-gray-600">Your feed is empty</p>
                <p className="text-xs mt-1">Follow friends to see their workouts here, or log and share your own!</p>
                <button
                  onClick={() => setTab('find')}
                  className="mt-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              feed.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Author row */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <Avatar name={item.user_name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{item.user_name}</p>
                      <p className="text-xs text-gray-400">{timeAgo(item.created_at)}</p>
                    </div>
                    <span className="text-2xl">{item.workout_emoji}</span>
                  </div>

                  {/* Workout info */}
                  <div className="px-4 pb-3">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    {item.caption && (
                      <p className="text-sm text-gray-600 mt-1">{item.caption}</p>
                    )}

                    <div className="flex gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={13} className="text-blue-500" />
                        {item.duration_min} min
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Flame size={13} className="text-orange-500" />
                        {item.calories_burned} kcal
                      </div>
                      {item.exercise_count > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Dumbbell size={13} className="text-purple-500" />
                          {item.exercise_count} exercise{item.exercise_count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Like bar */}
                  <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-50">
                    <button
                      onClick={() => handleLike(item)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-125 duration-150 ${
                        item.liked_by_me ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
                      }`}
                    >
                      <Heart
                        size={16}
                        fill={item.liked_by_me ? 'currentColor' : 'none'}
                        style={{ transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), fill 0.1s' }}
                      />
                      {item.likes_count > 0 && item.likes_count}
                    </button>
                    <span className="text-xs text-gray-400 ml-1">
                      {item.likes_count === 1 ? '1 like' : item.likes_count > 1 ? `${item.likes_count} likes` : 'Be the first to like'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Find Friends tab ── */}
        {tab === 'find' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                autoFocus
              />
            </div>

            {searchLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <UserRowSkeleton key={i} />)}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                    <Avatar name={user.full_name} size="sm" />
                    <p className="flex-1 text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                    <button
                      onClick={() => handleFollow(user.id, user.is_following)}
                      disabled={followingInProgress.has(user.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-60 ${
                        user.is_following
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {followingInProgress.has(user.id) ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : user.is_following ? (
                        <><UserCheck size={13} /> Following</>
                      ) : (
                        <><UserPlus size={13} /> Follow</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center py-8 text-gray-400 text-sm">No users found</div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Type a name to search for friends
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
