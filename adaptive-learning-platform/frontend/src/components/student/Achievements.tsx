import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, LinearProgress, Avatar, Dialog, DialogTitle, DialogContent, Tooltip } from '@mui/material';
import { Achievement, StudentStats } from '../../types/gamification';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarIcon from '@mui/icons-material/Star';
import ExploreIcon from '@mui/icons-material/Explore';

const mockStats: StudentStats = {
    currentStreak: 3,
    longestStreak: 5,
    totalPoints: 1250,
    achievements: [
        { id: 'a1', title: 'First Steps', description: 'Complete 1 lesson', icon: 'star', progress: 100, unlockedAt: '2023-10-26', type: 'milestone' },
        { id: 'a2', title: 'Knowledge Seeker', description: 'Complete 10 lessons', icon: 'star', progress: 40, type: 'milestone' },
        { id: 'a3', title: '3-Day Streak', description: 'Learn 3 days in a row', icon: 'fire', progress: 100, unlockedAt: '2023-10-28', type: 'streak' },
        { id: 'a4', title: 'Week Warrior', description: '7-day streak', icon: 'fire', progress: 42, type: 'streak' },
        { id: 'a5', title: 'Perfect Score', description: '100% on a quiz', icon: 'trophy', progress: 100, unlockedAt: '2023-10-27', type: 'performance' },
        { id: 'a6', title: 'Speed Demon', description: 'Complete quiz in <50% expected time', icon: 'trophy', progress: 0, type: 'performance' },
        { id: 'a7', title: 'Cross-Disciplinary', description: 'Learn concepts from 3 different subjects', icon: 'explore', progress: 66, type: 'exploration' },
    ]
};

const getIcon = (iconName: string, unlocked: boolean) => {
    const color = unlocked ? '#D97706' : '#8C8C8C';
    switch (iconName) {
        case 'fire': return <LocalFireDepartmentIcon sx={{ color, fontSize: 36 }} />;
        case 'trophy': return <EmojiEventsIcon sx={{ color, fontSize: 36 }} />;
        case 'explore': return <ExploreIcon sx={{ color, fontSize: 36 }} />;
        case 'star':
        default: return <StarIcon sx={{ color, fontSize: 36 }} />;
    }
};

export const Achievements: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);

    const handleOpen = (ach: Achievement) => {
        setSelectedAch(ach);
        setOpen(true);
    };

    const earnedCount = mockStats.achievements.filter(a => a.progress >= 100).length;

    return (
        <Card elevation={0} sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.08)',
        }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant="body1" fontWeight={700} sx={{ color: '#1A1A1A' }}>
                        {earnedCount}/{mockStats.achievements.length} Unlocked
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocalFireDepartmentIcon sx={{ color: '#D97706', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#D97706' }}>{mockStats.currentStreak} Day</Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {mockStats.achievements.map(ach => {
                        const unlocked = ach.progress >= 100;
                        return (
                            <Tooltip key={ach.id} title={unlocked ? `${ach.title} ✓` : `${ach.title}: ${ach.progress}%`}>
                                <Box
                                    onClick={() => handleOpen(ach)}
                                    sx={{
                                        cursor: 'pointer',
                                        opacity: unlocked ? 1 : 0.4,
                                        transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                                        '&:hover': {
                                            transform: 'scale(1.15)',
                                            opacity: unlocked ? 1 : 0.6,
                                        },
                                    }}
                                >
                                    <Avatar sx={{
                                        width: 56, height: 56,
                                        bgcolor: unlocked ? 'rgba(217, 119, 6, 0.08)' : 'rgba(0,0,0,0.03)',
                                        border: unlocked ? '2px solid rgba(217, 119, 6, 0.3)' : '2px solid rgba(0,0,0,0.08)',
                                        ...(unlocked && {
                                            boxShadow: '0 0 12px rgba(217, 119, 6, 0.15)',
                                        }),
                                    }}>
                                        {getIcon(ach.icon, unlocked)}
                                    </Avatar>
                                </Box>
                            </Tooltip>
                        );
                    })}
                </Box>
            </CardContent>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 4,
                        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
                    }
                }}
            >
                {selectedAch && (
                    <>
                        <DialogTitle sx={{ textAlign: 'center', color: '#1A1A1A', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>
                            {selectedAch.title}
                        </DialogTitle>
                        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
                            <Avatar sx={{
                                width: 88, height: 88, mx: 'auto', my: 2,
                                bgcolor: selectedAch.progress >= 100 ? 'rgba(217, 119, 6, 0.08)' : 'rgba(0,0,0,0.03)',
                                border: selectedAch.progress >= 100 ? '3px solid rgba(217, 119, 6, 0.3)' : '3px solid rgba(0,0,0,0.08)',
                                ...(selectedAch.progress >= 100 && {
                                    boxShadow: '0 0 20px rgba(217, 119, 6, 0.15)',
                                }),
                            }}>
                                {getIcon(selectedAch.icon, selectedAch.progress >= 100)}
                            </Avatar>
                            <Typography variant="body1" sx={{ color: '#5C5C5C' }} gutterBottom>
                                {selectedAch.description}
                            </Typography>

                            <Box sx={{ mt: 3, px: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#8C8C8C' }}>Progress</Typography>
                                    <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 700 }}>{selectedAch.progress}%</Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={selectedAch.progress}
                                    sx={{
                                        height: 8, borderRadius: 4,
                                        bgcolor: 'rgba(0,0,0,0.06)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                            background: selectedAch.progress >= 100
                                                ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                                                : 'linear-gradient(90deg, #2D5A3D, #4A8C62)',
                                        }
                                    }}
                                />
                            </Box>

                            {selectedAch.unlockedAt && (
                                <Typography variant="caption" sx={{ color: '#2D5A3D', display: 'block', mt: 2, fontWeight: 600 }}>
                                    ✓ Unlocked {new Date(selectedAch.unlockedAt).toLocaleDateString()}
                                </Typography>
                            )}
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Card>
    );
};

export default Achievements;
