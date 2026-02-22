export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // URL or icon identifier
    unlockedAt?: string; // ISO datestring
    progress: number; // 0 to 100
    type: 'milestone' | 'streak' | 'performance' | 'exploration';
}

export interface StudentStats {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    achievements: Achievement[];
}
