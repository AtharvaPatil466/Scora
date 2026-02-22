import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Avatar, AvatarGroup, Button, LinearProgress, List, ListItem, ListItemAvatar, ListItemText, Divider, Chip } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface GroupMember {
    id: string;
    name: string;
    avatarUrl?: string;
    masteryAssisting: number;
}

interface GroupContext {
    id: string;
    name: string;
    topic: string;
    members: GroupMember[];
    goal: string;
    progress: number;
    activeDiscussions: number;
}

const mockGroups: GroupContext[] = [
    {
        id: 'g1',
        name: 'Algebra Avengers',
        topic: 'Linear Equations',
        goal: 'Master "Systems of Equations" this week',
        progress: 65,
        activeDiscussions: 3,
        members: [
            { id: 'm1', name: 'Sam', masteryAssisting: 5 },
            { id: 'm2', name: 'Alex', masteryAssisting: 2 },
            { id: 'm3', name: 'Jordan', masteryAssisting: 8 },
            { id: 'm4', name: 'Taylor', masteryAssisting: 4 },
        ]
    },
    {
        id: 'g2',
        name: 'Geometry Geniuses',
        topic: 'Triangles',
        goal: 'Complete all Angle theorems',
        progress: 20,
        activeDiscussions: 1,
        members: [
            { id: 'm1', name: 'Sam', masteryAssisting: 5 },
            { id: 'm5', name: 'Casey', masteryAssisting: 7 },
        ]
    }
];

const stringToColor = (string: string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 55%)`;
};

export const StudyGroups: React.FC = () => {
    const [activeGroup] = useState<GroupContext>(mockGroups[0]);

    return (
        <Card elevation={0} sx={{
            bgcolor: 'rgba(10, 10, 15, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                        <GroupIcon sx={{ color: 'primary.light', fontSize: 20 }} /> My Groups
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        sx={{
                            fontSize: '0.7rem',
                            borderColor: 'rgba(255,255,255,0.1)',
                            color: 'text.secondary',
                            '&:hover': { borderColor: 'rgba(255,255,255,0.2)' },
                        }}
                    >
                        Find Group
                    </Button>
                </Box>

                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.primary' }}>{activeGroup.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.muted' }}>Focusing on: {activeGroup.topic}</Typography>

                    <Box sx={{ mt: 2, mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'text.muted', fontSize: '0.65rem' }}>{activeGroup.goal}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.65rem' }}>{activeGroup.progress}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={activeGroup.progress}
                        sx={{
                            height: 4, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #3B82F6, #38BDF8)',
                                borderRadius: 2,
                            }
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>Members</Typography>
                    <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem', border: '2px solid #0A0A0F' } }}>
                        {activeGroup.members.map((member) => (
                            <Avatar key={member.id} sx={{ bgcolor: stringToColor(member.name) }}>{member.name.charAt(0)}</Avatar>
                        ))}
                    </AvatarGroup>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', my: 2 }} />

                <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.6rem', display: 'block', mb: 1.5 }}>
                    Active Discussions
                </Typography>
                <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <ListItem
                        disableGutters
                        secondaryAction={
                            <Chip
                                size="small"
                                label="Help"
                                sx={{
                                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#EF4444',
                                    fontWeight: 600,
                                    fontSize: '0.6rem',
                                    height: 22,
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                }}
                            />
                        }
                        sx={{
                            p: 1.5, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                        }}
                    >
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: stringToColor("Alex"), fontSize: '0.7rem' }}>
                                <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem' }}>Alex asks:</Typography>}
                            secondary={<Typography variant="caption" sx={{ color: 'text.muted' }}>"I'm stuck on isolating variables..."</Typography>}
                        />
                    </ListItem>
                    <ListItem
                        disableGutters
                        secondaryAction={
                            <Button size="small" sx={{ color: 'primary.light', fontSize: '0.7rem', minWidth: 'auto' }}>Reply</Button>
                        }
                        sx={{
                            p: 1.5, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                        }}
                    >
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: stringToColor("Jordan"), fontSize: '0.7rem' }}>
                                <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem' }}>Jordan shared:</Typography>}
                            secondary={<Typography variant="caption" sx={{ color: 'text.muted' }}>"Here is a great visual trick I found..."</Typography>}
                        />
                    </ListItem>
                </List>
            </CardContent>
        </Card>
    );
};

export default StudyGroups;
