import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, LinearProgress, IconButton, Divider, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import SettingsIcon from '@mui/icons-material/Settings';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SyncIcon from '@mui/icons-material/Sync';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { ContentViewerProps } from '../../types/content';
import { getMaterial } from '../../api';

export const ContentViewer: React.FC<ContentViewerProps> = ({ contentId, studentId, contentType, title, contentUrl, materialId, onComplete, onProgress }) => {
    const safeTitle = title || 'Lesson';
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState('notes');
    const [material, setMaterial] = useState<any>(null);
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && !material) {
            timer = setInterval(() => {
                setProgress(p => {
                    const newP = p + 2;
                    onProgress(newP);
                    if (newP >= 100) {
                        clearInterval(timer);
                        setIsPlaying(false);
                        return 100;
                    }
                    return newP;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPlaying, onProgress, material]);

    useEffect(() => {
        if (materialId) {
            getMaterial(studentId, materialId).then(data => {
                if (data.expanded) {
                    setMaterial(data.expanded);
                    setProgress(10); // Initial progress
                }
            }).catch(err => console.error("Failed to fetch material details:", err));
        }
    }, [materialId, studentId]);

    const handleNextChapter = () => {
        if (!material) return;
        if (activeChapterIndex < material.chapters.length - 1) {
            setActiveChapterIndex(prev => prev + 1);
            setProgress(Math.min(100, Math.round(((activeChapterIndex + 2) / material.chapters.length) * 100)));
        } else {
            setProgress(100);
        }
    };

    const handleComplete = () => {
        onComplete({
            timeSpent: 120,
            completed: true,
            progress: 100
        });
    };

    const tabs = [
        { key: 'transcript', label: 'Transcript' },
        { key: 'notes', label: 'Notes' },
        { key: 'tutor', label: 'Ask Tutor' },
    ];

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 1, md: 3 }, mt: 2 }} className="animate-in">
            {/* Top Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 1, fontFamily: '"Playfair Display", serif' }}>
                    {title || 'Concepts Overview'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[SearchIcon, PersonIcon, MenuIcon].map((Icon, i) => (
                        <IconButton
                            key={i}
                            size="small"
                            sx={{
                                color: '#8C8C8C',
                                bgcolor: 'rgba(0,0,0,0.03)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.06)', color: '#1A1A1A' },
                            }}
                        >
                            <Icon fontSize="small" />
                        </IconButton>
                    ))}
                </Box>
            </Box>

            {/* Video Player or Material Content Area */}
            {material ? (
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: '#FFFFFF',
                        minHeight: 420,
                        borderRadius: 4,
                        p: 4,
                        mb: 4,
                        border: '1px solid rgba(0,0,0,0.12)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box sx={{
                            width: 48, height: 48, borderRadius: 2,
                            bgcolor: 'rgba(45, 90, 61, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#2D5A3D',
                        }}>
                            <MenuBookIcon />
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#8C8C8C', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                                Part {activeChapterIndex + 1} of {material.chapters.length}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                                {material.chapters[activeChapterIndex]?.title}
                            </Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#333',
                            lineHeight: 1.8,
                            fontSize: '1.05rem',
                            whiteSpace: 'pre-line'
                        }}
                    >
                        {material.chapters[activeChapterIndex]?.content}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                        {activeChapterIndex < material.chapters.length - 1 ? (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNextChapter}
                                sx={{ bgcolor: '#2D5A3D', '&:hover': { bgcolor: '#1B4332' } }}
                            >
                                Continue Reading
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setProgress(100)}
                                sx={{ bgcolor: '#2D5A3D', '&:hover': { bgcolor: '#1B4332' } }}
                            >
                                Finish Material
                            </Button>
                        )}
                    </Box>
                </Paper>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        position: 'relative',
                        bgcolor: '#1A1A1A',
                        height: 420,
                        borderRadius: 4,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 4,
                        border: '1px solid rgba(0,0,0,0.12)',
                    }}
                >
                    {/* Animated background */}
                    <Box sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: `
                            radial-gradient(ellipse at 30% 50%, rgba(45, 90, 61, 0.2) 0%, transparent 50%),
                            radial-gradient(ellipse at 70% 50%, rgba(74, 140, 98, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at center, rgba(45, 90, 61, 0.1) 0%, #1A1A1A 70%)
                        `,
                        zIndex: 0,
                    }} />

                    {/* Play/Pause Button */}
                    <IconButton
                        onClick={() => setIsPlaying(!isPlaying)}
                        sx={{
                            zIndex: 1,
                            color: 'white',
                            transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                            '&:hover': { transform: 'scale(1.15)' },
                            ...(isPlaying ? {} : {
                                animation: 'pulseGlow 3s ease-in-out infinite',
                                borderRadius: '50%',
                            })
                        }}
                    >
                        {isPlaying
                            ? <PauseCircleFilledIcon sx={{ fontSize: 88, opacity: 0.9 }} />
                            : <PlayCircleFilledIcon sx={{ fontSize: 88 }} />
                        }
                    </IconButton>
                    <Typography variant="body2" sx={{
                        color: 'rgba(255,255,255,0.6)',
                        zIndex: 1, mt: 1,
                        opacity: isPlaying ? 0 : 1,
                        transition: 'opacity 0.4s ease',
                        fontWeight: 500,
                    }}>
                        Click to {isPlaying ? 'pause' : 'play'}
                    </Typography>

                    {/* Player Controls */}
                    <Box sx={{
                        position: 'absolute', bottom: 0, width: '100%', p: 2.5,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                        zIndex: 1,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>01:23</Typography>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    flexGrow: 1, height: 4, borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: 'primary.main',
                                        borderRadius: 2,
                                        background: 'linear-gradient(90deg, #2D5A3D, #4A8C62)',
                                    }
                                }}
                            />
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>15:00</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button size="small" sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 'auto', fontWeight: 600, fontSize: '0.75rem' }}>1x</Button>
                            <Box>
                                {[ClosedCaptionIcon, SettingsIcon, FullscreenIcon].map((Icon, i) => (
                                    <IconButton key={i} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                                        <Icon fontSize="small" />
                                    </IconButton>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* AI Generated Insight */}
            <Paper
                elevation={0}
                sx={{
                    p: 3, mb: 4, borderRadius: 3,
                    border: '1px solid rgba(45, 90, 61, 0.12)',
                    bgcolor: 'rgba(45, 90, 61, 0.03)',
                    position: 'relative', overflow: 'hidden',
                }}
                className="animate-in animate-in-delay-1"
            >
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(180deg, #2D5A3D, #4A8C62)' }} />
                <Box sx={{ display: 'flex', gap: 2, pl: 1 }}>
                    <AutoAwesomeIcon sx={{ color: '#2D5A3D', mt: 0.3 }} />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#2D5A3D', display: 'block', letterSpacing: 1, fontSize: '0.65rem', mb: 1 }}>
                            AI-GENERATED FOR YOU
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1A1A1A', fontStyle: 'italic', mb: 2, lineHeight: 1.7 }}>
                            {safeTitle.toLowerCase().includes('fraction')
                                ? '"Think of fractions like pizza slices. When adding fractions, you need everyone to have the same size slices (common denominator) before you can combine them!"'
                                : safeTitle.toLowerCase().includes('geometry')
                                    ? '"Picture geometry as the language of shapes. Every angle, line, and curve tells a story — and learning their relationships helps you decode the visual world!"'
                                    : safeTitle.toLowerCase().includes('equation')
                                        ? '"Think of equations like a balanced scale. Whatever you do to one side, you must do to the other — that\'s the golden rule!"'
                                        : `"Let's explore ${safeTitle} step by step. This AI-generated insight is tailored to help you connect new concepts to what you already know!"`}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button size="small" startIcon={<SyncIcon sx={{ fontSize: 14 }} />} sx={{ color: '#8C8C8C', fontSize: '0.75rem' }}>Regenerate</Button>
                            <Button size="small" startIcon={<StarBorderIcon sx={{ fontSize: 14 }} />} sx={{ color: '#8C8C8C', fontSize: '0.75rem' }}>Save</Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Layout Split: Chapters & Interactions */}
            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }} className="animate-in animate-in-delay-2">
                {/* Chapters */}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, fontSize: '0.65rem', display: 'block', mb: 2 }}>
                        CHAPTERS
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {material ? (
                            material.chapters.map((ch: any, i: number) => (
                                <Box
                                    key={i}
                                    onClick={() => {
                                        setActiveChapterIndex(i);
                                    }}
                                    sx={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        p: 1.5, borderRadius: 2, cursor: 'pointer',
                                        bgcolor: i === activeChapterIndex ? 'rgba(45, 90, 61, 0.04)' : 'transparent',
                                        border: i === activeChapterIndex ? '1px solid rgba(45, 90, 61, 0.15)' : '1px solid transparent',
                                        transition: 'all 200ms ease',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            display: 'flex', gap: 1, alignItems: 'center',
                                            color: i < activeChapterIndex ? '#2D5A3D' : i === activeChapterIndex ? '#2D5A3D' : '#8C8C8C',
                                            fontWeight: i === activeChapterIndex ? 600 : 400,
                                        }}
                                    >
                                        {i < activeChapterIndex
                                            ? <CheckCircleIcon sx={{ fontSize: 18, color: '#2D5A3D' }} />
                                            : i === activeChapterIndex
                                                ? <PlayCircleFilledIcon sx={{ fontSize: 18 }} />
                                                : <RadioButtonUncheckedIcon sx={{ fontSize: 18, opacity: 0.4 }} />
                                        }
                                        {ch.title}
                                    </Typography>
                                    {i === activeChapterIndex && (
                                        <Chip label="Current" size="small" sx={{
                                            bgcolor: 'rgba(45, 90, 61, 0.08)',
                                            color: '#2D5A3D',
                                            fontWeight: 600,
                                            fontSize: '0.6rem',
                                            height: 22,
                                        }} />
                                    )}
                                </Box>
                            ))
                        ) : (
                            // Original fallback hardcoded chapters
                            (safeTitle.toLowerCase().includes('fraction')
                                ? [
                                    { label: '1. What Are Fractions?', done: true, current: false },
                                    { label: '2. Finding Common Denominators', done: false, current: true },
                                    { label: '3. Adding & Subtracting', done: false, current: false },
                                ]
                                : safeTitle.toLowerCase().includes('geometry')
                                    ? [
                                        { label: '1. Points, Lines & Angles', done: true, current: false },
                                        { label: '2. Shapes & Their Properties', done: false, current: true },
                                        { label: '3. Area & Perimeter', done: false, current: false },
                                    ]
                                    : [
                                        { label: `1. Introduction to ${safeTitle}`, done: true, current: false },
                                        { label: '2. Core Concepts Explained', done: false, current: true },
                                        { label: '3. Practice Quiz', done: false, current: false },
                                    ]
                            ).map((ch, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        p: 1.5, borderRadius: 2,
                                        bgcolor: ch.current ? 'rgba(45, 90, 61, 0.04)' : 'transparent',
                                        border: ch.current ? '1px solid rgba(45, 90, 61, 0.15)' : '1px solid transparent',
                                        transition: 'all 200ms ease',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            display: 'flex', gap: 1, alignItems: 'center',
                                            color: ch.done ? '#2D5A3D' : ch.current ? '#2D5A3D' : '#8C8C8C',
                                            fontWeight: ch.current ? 600 : 400,
                                        }}
                                    >
                                        {ch.done
                                            ? <CheckCircleIcon sx={{ fontSize: 18, color: '#2D5A3D' }} />
                                            : ch.current
                                                ? <PlayCircleFilledIcon sx={{ fontSize: 18 }} />
                                                : <RadioButtonUncheckedIcon sx={{ fontSize: 18, opacity: 0.4 }} />
                                        }
                                        {ch.label}
                                    </Typography>
                                    {ch.current && (
                                        <Chip label="Current" size="small" sx={{
                                            bgcolor: 'rgba(45, 90, 61, 0.08)',
                                            color: '#2D5A3D',
                                            fontWeight: 600,
                                            fontSize: '0.6rem',
                                            height: 22,
                                        }} />
                                    )}
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>

                {/* Interaction Tabs */}
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 0, mb: 2, borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'relative' }}>
                        {tabs.map((tab) => (
                            <Button
                                key={tab.key}
                                variant="text"
                                onClick={() => setActiveTab(tab.key)}
                                sx={{
                                    color: activeTab === tab.key ? '#2D5A3D' : '#8C8C8C',
                                    fontWeight: activeTab === tab.key ? 700 : 400,
                                    fontSize: '0.85rem',
                                    pb: 1.5,
                                    px: 2,
                                    borderRadius: 0,
                                    borderBottom: activeTab === tab.key ? '2px solid' : '2px solid transparent',
                                    borderColor: activeTab === tab.key ? '#2D5A3D' : 'transparent',
                                    transition: 'all 200ms ease',
                                    '&:hover': {
                                        bgcolor: 'transparent',
                                        color: '#1A1A1A',
                                    },
                                }}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </Box>

                    {activeTab === 'notes' && (
                        <Paper elevation={0} sx={{
                            p: 2.5, borderRadius: 2, minHeight: 150,
                            bgcolor: '#FFFFFF',
                            border: '1px solid rgba(0,0,0,0.08)',
                        }}>
                            <Typography variant="caption" sx={{ color: '#8C8C8C', display: 'block', mb: 1, fontWeight: 600, letterSpacing: 0.5, fontSize: '0.6rem' }}>
                                YOUR NOTES (auto-saved)
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1A1A1A', lineHeight: 1.7 }}>
                                "Remember: check discriminant first!"
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#8C8C8C', display: 'block', mt: 4, textAlign: 'right' }}>
                                Last edited: 2 min ago
                            </Typography>
                        </Paper>
                    )}
                </Box>
            </Box>

            {/* Bottom Actions */}
            <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => setProgress(100)}
                    sx={{
                        borderColor: 'rgba(0,0,0,0.12)',
                        color: '#5C5C5C',
                        '&:hover': { borderColor: 'rgba(0,0,0,0.2)' },
                    }}
                >
                    Mark Complete
                </Button>
                <Button
                    variant="contained"
                    onClick={handleComplete}
                    disabled={progress < 100}
                    sx={{
                        background: '#2D5A3D',
                        '&:hover': {
                            background: '#1B4332',
                            boxShadow: '0 8px 24px rgba(45, 90, 61, 0.2)',
                        },
                        '&.Mui-disabled': {
                            background: 'rgba(0,0,0,0.06)',
                            color: 'rgba(0,0,0,0.25)',
                        }
                    }}
                >
                    Take Quiz 🎯
                </Button>
            </Box>
        </Box>
    );
};

export default ContentViewer;
