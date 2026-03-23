import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Target, Flame, Calendar, LogOut, Upload, Plus, X, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CryptoJS from 'crypto-js';

function getGravatarUrl(email) {
  const hash = CryptoJS.MD5(email.toLowerCase()).toString();
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
}

function generateChartData(progress, rooms) {
  if (!progress.length) return [];
  
  const sortedProgress = [...progress].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const data = [];
  let cumulativePoints = 0;

  sortedProgress.forEach((p, idx) => {
    cumulativePoints += p.points_earned || 0;
    data.push({
      date: format(new Date(p.created_date), 'MMM d'),
      points: cumulativePoints,
      roomsCompleted: sortedProgress.slice(0, idx + 1).filter(x => x.completed).length,
    });
  });

  return data.length > 0 ? data : [];
}

export default function Profile() {
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const totalPoints = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const completedRooms = progress.filter(p => p.completed).length;
  const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
  const earnedBadges = badges.filter(b => totalPoints >= (b.points_required || 0));

  const chartData = generateChartData(progress, rooms);
  const userLinks = user?.links || [];
  const userBio = user?.bio || '';
  const useGravatar = user?.use_gravatar !== false;
  const avatarUrl = user?.avatar_url || (useGravatar ? getGravatarUrl(user?.email) : null);

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    await updateUserMutation.mutateAsync({
      avatar_url: result.file_url,
      use_gravatar: false,
    });
    setIsUploading(false);
  };

  const handleUseGravatar = async () => {
    await updateUserMutation.mutateAsync({
      use_gravatar: true,
      avatar_url: null,
    });
  };

  const handleSaveBio = async () => {
    await updateUserMutation.mutateAsync({ bio: bioText });
    setIsEditingBio(false);
  };

  const handleAddLink = async () => {
    setLinkError('');
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setLinkError('Title and URL are required');
      return;
    }
    if (!linkUrl.startsWith('https://')) {
      setLinkError('URL must start with https://');
      return;
    }

    const newLinks = [...userLinks, { title: linkTitle, url: linkUrl }];
    await updateUserMutation.mutateAsync({ links: newLinks });
    setLinkTitle('');
    setLinkUrl('');
    setIsAddingLink(false);
  };

  const handleRemoveLink = async (idx) => {
    const newLinks = userLinks.filter((_, i) => i !== idx);
    await updateUserMutation.mutateAsync({ links: newLinks });
  };

  const completedRoomDetails = progress
    .filter(p => p.completed)
    .map(p => rooms.find(r => r.id === p.room_id))
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar section */}
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.full_name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                {user?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* User info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-foreground">{user?.full_name || 'Hacker'}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.created_date && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-center sm:justify-start">
                <Calendar className="w-3 h-3" /> Joined {format(new Date(user.created_date), 'MMMM yyyy')}
              </p>
            )}
            <div className="flex gap-2 mt-3 justify-center sm:justify-start">
              {useGravatar ? (
                <Button size="sm" variant="outline" onClick={handleUseGravatar} className="text-xs">
                  Using Gravatar ✓
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleUseGravatar} className="text-xs">
                  Switch to Gravatar
                </Button>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => base44.auth.logout()} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">Total Points</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <Target className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{completedRooms}</p>
          <p className="text-xs text-muted-foreground">Rooms Done</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{progress.length}</p>
          <p className="text-xs text-muted-foreground">Rooms Started</p>
        </div>
      </div>

      {/* Bio Section */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Bio</h2>
          {!isEditingBio && (
            <Button size="sm" variant="outline" onClick={() => { setBioText(userBio); setIsEditingBio(true); }}>
              Edit
            </Button>
          )}
        </div>
        {isEditingBio ? (
          <div className="space-y-3">
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40 resize-none min-h-[100px]"
              maxLength={500}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{bioText.length}/500</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditingBio(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveBio}>
                  Save Bio
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {userBio || <span className="text-muted-foreground italic">No bio yet. Click Edit to add one.</span>}
          </p>
        )}
      </div>

      {/* Links Section */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Links</h2>
          {!isAddingLink && (
            <Button size="sm" variant="outline" onClick={() => setIsAddingLink(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Link
            </Button>
          )}
        </div>

        {isAddingLink && (
          <div className="space-y-3 mb-4 pb-4 border-b border-border">
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Link title (e.g., GitHub)"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40"
            />
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40"
            />
            {linkError && <p className="text-xs text-destructive">{linkError}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddLink}>
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setIsAddingLink(false); setLinkError(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {userLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No links yet. Add one to share your websites!</p>
        ) : (
          <div className="space-y-2">
            {userLinks.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{link.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleRemoveLink(idx)} className="text-destructive hover:text-destructive/80">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Chart */}
      {chartData.length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Progress Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                labelStyle={{ color: 'var(--color-foreground)' }}
              />
              <Line
                type="monotone"
                dataKey="points"
                stroke="var(--color-primary)"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Completed Rooms */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Completed Rooms ({completedRoomDetails.length})</h2>
        {completedRoomDetails.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed rooms yet. Start hacking!</p>
        ) : (
          <div className="space-y-2">
            {completedRoomDetails.map(room => (
              <div key={room.id} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{room.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{room.description}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-bold text-primary">{room.points} pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Badges</h2>
        {earnedBadges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No badges earned yet. Keep hacking!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {earnedBadges.map(badge => (
              <div key={badge.id} className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <span className="text-3xl">{badge.icon || '🏅'}</span>
                <p className="text-sm font-semibold text-foreground mt-2">{badge.title}</p>
                <p className="text-[10px] text-muted-foreground">{badge.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Locked badges */}
        {badges.filter(b => totalPoints < (b.points_required || 0)).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Locked</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.filter(b => totalPoints < (b.points_required || 0)).map(badge => (
                <div key={badge.id} className="p-4 rounded-xl bg-secondary/50 border border-border text-center opacity-50">
                  <span className="text-3xl grayscale">🔒</span>
                  <p className="text-sm font-semibold text-foreground mt-2">{badge.title}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.points_required} pts needed</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}