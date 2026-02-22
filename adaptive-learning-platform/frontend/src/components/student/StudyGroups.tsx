import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Avatar, AvatarGroup, Button, LinearProgress, Divider, Chip, Tooltip, IconButton } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';

interface MasteryProfile {
    [concept: string]: number;
}

interface PeerStudent {
    id: string;
    name: string;
    mastery: MasteryProfile;
}

interface PeerMatch {
    peer: PeerStudent;
    youCanTeach: string[];
    theyCanTeach: string[];
    matchScore: number;
    whyMatch: string;
}

// Sam's mastery profile (current student)
const samMastery: MasteryProfile = {
    'Basic Addition': 0.90,
    'Basic Subtraction': 0.85,
    'Counting': 0.50,
    'Number Recognition': 0.50,
    'Addition': 0.50,
    'Basic Equations': 0.50,
    'Fractions': 0.25,
    'Geometry': 0.15,
    'Decimals': 0.10,
    'Early Multiplication': 0.30,
};

// Mock peer students with different mastery distributions
const mockPeers: PeerStudent[] = [
    {
        id: 'p1', name: 'Jordan',
        mastery: {
            'Basic Addition': 0.70,
            'Basic Subtraction': 0.60,
            'Counting': 0.40,
            'Number Recognition': 0.45,
            'Addition': 0.35,
            'Basic Equations': 0.30,
            'Fractions': 0.80,
            'Geometry': 0.82,
            'Decimals': 0.75,
            'Early Multiplication': 0.88,
        },
    },
    {
        id: 'p2', name: 'Riley',
        mastery: {
            'Basic Addition': 0.95,
            'Basic Subtraction': 0.90,
            'Counting': 0.88,
            'Number Recognition': 0.92,
            'Addition': 0.30,
            'Basic Equations': 0.25,
            'Fractions': 0.15,
            'Geometry': 0.60,
            'Decimals': 0.55,
            'Early Multiplication': 0.20,
        },
    },
    {
        id: 'p3', name: 'Casey',
        mastery: {
            'Basic Addition': 0.78,
            'Basic Subtraction': 0.72,
            'Counting': 0.65,
            'Number Recognition': 0.70,
            'Addition': 0.82,
            'Basic Equations': 0.78,
            'Fractions': 0.12,
            'Geometry': 0.10,
            'Decimals': 0.45,
            'Early Multiplication': 0.55,
        },
    },
];

// Compute complementary matches
const computeMatches = (): PeerMatch[] => {
    const GAP_THRESHOLD = 0.25;

    return mockPeers.map(peer => {
        const youCanTeach: string[] = [];
        const theyCanTeach: string[] = [];

        Object.keys(samMastery).forEach(concept => {
            const samScore = samMastery[concept] || 0;
            const peerScore = peer.mastery[concept] || 0;
            if (samScore - peerScore >= GAP_THRESHOLD) youCanTeach.push(concept);
            if (peerScore - samScore >= GAP_THRESHOLD) theyCanTeach.push(concept);
        });

        const totalGaps = youCanTeach.length + theyCanTeach.length;
        const matchScore = Math.min(100, Math.round((totalGaps / (Object.keys(samMastery).length)) * 100 * 1.5));

        // Find strongest complementary pair for "why" text
        let bestTeach = youCanTeach[0] || '';
        let bestLearn = theyCanTeach[0] || '';
        let bestTeachDelta = 0;
        let bestLearnDelta = 0;
        youCanTeach.forEach(c => {
            const d = samMastery[c] - (peer.mastery[c] || 0);
            if (d > bestTeachDelta) { bestTeachDelta = d; bestTeach = c; }
        });
        theyCanTeach.forEach(c => {
            const d = (peer.mastery[c] || 0) - samMastery[c];
            if (d > bestLearnDelta) { bestLearnDelta = d; bestLearn = c; }
        });

        const whyMatch = bestTeach && bestLearn
            ? `${peer.name} is strong in ${bestLearn} (${Math.round((peer.mastery[bestLearn] || 0) * 100)}%) where you're at ${Math.round(samMastery[bestLearn] * 100)}%. You're strong in ${bestTeach} (${Math.round(samMastery[bestTeach] * 100)}%) where they're at ${Math.round((peer.mastery[bestTeach] || 0) * 100)}%.`
            : `Complementary knowledge profiles with ${totalGaps} gap opportunities.`;

        return { peer, youCanTeach, theyCanTeach, matchScore, whyMatch };
    }).sort((a, b) => b.matchScore - a.matchScore);
};

const stringToColor = (string: string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 55%)`;
};

export const StudyGroups: React.FC = () => {
    const [matches] = useState<PeerMatch[]>(computeMatches);
    const [expandedPeer, setExpandedPeer] = useState<string | null>(null);

    return (
        <Card elevation={0} sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.08)',
        }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1A1A1A' }}>
                        <GroupIcon sx={{ color: '#2D5A3D', fontSize: 20 }} /> Study Partners
                    </Typography>
                    <Chip
                        icon={<AutoAwesomeIcon sx={{ fontSize: 12, color: '#2D5A3D !important' }} />}
                        label="AI-Matched"
                        size="small"
                        sx={{
                            bgcolor: 'rgba(45, 90, 61, 0.06)',
                            color: '#2D5A3D',
                            fontWeight: 600,
                            fontSize: '0.6rem',
                            height: 22,
                            border: '1px solid rgba(45,90,61,0.12)',
                        }}
                    />
                </Box>

                <Typography variant="caption" sx={{ color: '#8C8C8C', display: 'block', mb: 2.5, lineHeight: 1.5 }}>
                    Matched based on complementary knowledge gaps — you teach each other what you know best.
                </Typography>

                {matches.map((match, idx) => (
                    <Box key={match.peer.id}>
                        {idx > 0 && <Divider sx={{ borderColor: 'rgba(0,0,0,0.05)', my: 1.5 }} />}
                        <Box
                            onClick={() => setExpandedPeer(expandedPeer === match.peer.id ? null : match.peer.id)}
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                                transition: 'background-color 200ms',
                            }}
                        >
                            {/* Peer header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Avatar sx={{
                                    width: 34, height: 34,
                                    bgcolor: stringToColor(match.peer.name),
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                }}>
                                    {match.peer.name.charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A1A1A' }}>
                                            {match.peer.name}
                                        </Typography>
                                        <Chip
                                            label={`${match.matchScore}% match`}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.58rem',
                                                fontWeight: 700,
                                                bgcolor: match.matchScore > 60 ? 'rgba(45,90,61,0.08)' : 'rgba(0,0,0,0.04)',
                                                color: match.matchScore > 60 ? '#2D5A3D' : '#8C8C8C',
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            {/* Teach/Learn pills */}
                            <Box sx={{ display: 'flex', gap: 2, ml: 6 }}>
                                {match.theyCanTeach.length > 0 && (
                                    <Box>
                                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#2D5A3D', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.3 }}>
                                            They teach you
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                                            {match.theyCanTeach.slice(0, 3).map(c => (
                                                <Chip key={c} label={c} size="small" sx={{
                                                    height: 18, fontSize: '0.55rem', fontWeight: 600,
                                                    bgcolor: 'rgba(45,90,61,0.06)', color: '#2D5A3D',
                                                }} />
                                            ))}
                                            {match.theyCanTeach.length > 3 && (
                                                <Chip label={`+${match.theyCanTeach.length - 3}`} size="small" sx={{
                                                    height: 18, fontSize: '0.55rem', fontWeight: 600,
                                                    bgcolor: 'rgba(0,0,0,0.04)', color: '#8C8C8C',
                                                }} />
                                            )}
                                        </Box>
                                    </Box>
                                )}
                                {match.youCanTeach.length > 0 && (
                                    <Box>
                                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 600, color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.3 }}>
                                            You teach them
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                                            {match.youCanTeach.slice(0, 3).map(c => (
                                                <Chip key={c} label={c} size="small" sx={{
                                                    height: 18, fontSize: '0.55rem', fontWeight: 600,
                                                    bgcolor: 'rgba(180,83,9,0.06)', color: '#B45309',
                                                }} />
                                            ))}
                                            {match.youCanTeach.length > 3 && (
                                                <Chip label={`+${match.youCanTeach.length - 3}`} size="small" sx={{
                                                    height: 18, fontSize: '0.55rem', fontWeight: 600,
                                                    bgcolor: 'rgba(0,0,0,0.04)', color: '#8C8C8C',
                                                }} />
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Box>

                            {/* Expanded view: Why this match */}
                            {expandedPeer === match.peer.id && (
                                <Box sx={{
                                    mt: 1.5, ml: 6, p: 1.5,
                                    bgcolor: 'rgba(45,90,61,0.03)',
                                    borderRadius: 1.5,
                                    borderLeft: '2px solid rgba(45,90,61,0.2)',
                                }}>
                                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#2D5A3D', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.3 }}>
                                        Why this match? →
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#5C5C5C', lineHeight: 1.5 }}>
                                        {match.whyMatch}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                ))}
            </CardContent>
        </Card>
    );
};

export default StudyGroups;
