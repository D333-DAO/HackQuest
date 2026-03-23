/**
 * Badge definitions and unlock criteria
 * Each badge defines how it can be earned
 */

export const BADGE_DEFINITIONS = {
  first_blood: {
    key: 'first_blood',
    title: 'First Blood',
    icon: '🩸',
    description: 'Complete your first room',
    criteria: (progress, rooms) => {
      const completed = progress.filter(p => p.completed).length;
      return completed >= 1;
    },
  },
  room_collector: {
    key: 'room_collector',
    title: 'Room Collector',
    icon: '📚',
    description: 'Complete 5 rooms',
    criteria: (progress, rooms) => {
      const completed = progress.filter(p => p.completed).length;
      return completed >= 5;
    },
  },
  room_master: {
    key: 'room_master',
    title: 'Room Master',
    icon: '👑',
    description: 'Complete 10 rooms',
    criteria: (progress, rooms) => {
      const completed = progress.filter(p => p.completed).length;
      return completed >= 10;
    },
  },
  expert: {
    key: 'expert',
    title: 'Expert',
    icon: '🔥',
    description: 'Complete a hard-difficulty room',
    criteria: (progress, rooms) => {
      const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
      const hardRooms = rooms.filter(r => r.difficulty === 'hard' && completedRoomIds.has(r.id));
      return hardRooms.length > 0;
    },
  },
  night_owl: {
    key: 'night_owl',
    title: 'Night Owl',
    icon: '🌙',
    description: 'Complete a room between 10 PM and 4 AM',
    criteria: (progress, rooms) => {
      return progress.some(p => {
        if (!p.completed || !p.updated_date) return false;
        const date = new Date(p.updated_date);
        const hour = date.getHours();
        return hour >= 22 || hour < 4;
      });
    },
  },
  early_bird: {
    key: 'early_bird',
    title: 'Early Bird',
    icon: '🌅',
    description: 'Complete a room between 5 AM and 8 AM',
    criteria: (progress, rooms) => {
      return progress.some(p => {
        if (!p.completed || !p.updated_date) return false;
        const date = new Date(p.updated_date);
        const hour = date.getHours();
        return hour >= 5 && hour < 8;
      });
    },
  },
  speed_demon: {
    key: 'speed_demon',
    title: 'Speed Demon',
    icon: '⚡',
    description: 'Complete 3 rooms in one day',
    criteria: (progress, rooms) => {
      const today = new Date().toDateString();
      const todayCompleted = progress.filter(
        p => p.completed && new Date(p.updated_date).toDateString() === today
      ).length;
      return todayCompleted >= 3;
    },
  },
  point_hunter: {
    key: 'point_hunter',
    title: 'Point Hunter',
    icon: '💎',
    description: 'Earn 500 points',
    criteria: (progress, rooms) => {
      const totalPoints = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      return totalPoints >= 500;
    },
  },
  elite: {
    key: 'elite',
    title: 'Elite',
    icon: '⭐',
    description: 'Earn 1000 points',
    criteria: (progress, rooms) => {
      const totalPoints = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      return totalPoints >= 1000;
    },
  },
  legend: {
    key: 'legend',
    title: 'Legend',
    icon: '👸',
    description: 'Earn 2000 points',
    criteria: (progress, rooms) => {
      const totalPoints = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      return totalPoints >= 2000;
    },
  },
  networking_expert: {
    key: 'networking_expert',
    title: 'Networking Expert',
    icon: '🌐',
    description: 'Complete 3 networking rooms',
    criteria: (progress, rooms) => {
      const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
      const networkRooms = rooms.filter(r => r.category === 'networking' && completedRoomIds.has(r.id));
      return networkRooms.length >= 3;
    },
  },
  web_warrior: {
    key: 'web_warrior',
    title: 'Web Warrior',
    icon: '🕸️',
    description: 'Complete 3 web hacking rooms',
    criteria: (progress, rooms) => {
      const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
      const webRooms = rooms.filter(r => r.category === 'web_hacking' && completedRoomIds.has(r.id));
      return webRooms.length >= 3;
    },
  },
};

/**
 * Evaluate which badges a user has unlocked
 */
export function getEarnedBadges(progress, rooms) {
  const earned = [];
  
  Object.values(BADGE_DEFINITIONS).forEach(badge => {
    if (badge.criteria(progress, rooms)) {
      earned.push(badge);
    }
  });
  
  return earned;
}

/**
 * Get badges that are not yet unlocked
 */
export function getLockedBadges(progress, rooms) {
  const earned = getEarnedBadges(progress, rooms);
  const earnedKeys = new Set(earned.map(b => b.key));
  
  return Object.values(BADGE_DEFINITIONS).filter(
    b => !earnedKeys.has(b.key)
  );
}