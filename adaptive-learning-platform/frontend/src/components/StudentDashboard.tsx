import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    Box, Typography, Card, CardContent, CircularProgress,
    Button, CardActions, Chip, Divider, Skeleton, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Grid from '@mui/material/Grid2';
import {
    setStudent, setRecommendations, setLoading
} from '../store';
import * as api from '../api';
import { Recommendation } from '../types';

import ContentViewer from './student/ContentViewer';
import AdaptiveQuiz from './student/AdaptiveQuiz';
import TutorChat from './student/TutorChat';
import Achievements from './student/Achievements';
import ProgressMap from './student/ProgressMap';
import StudyGroups from './student/StudyGroups';
import { CompletionData } from '../types/content';
import { QuizResult } from '../types/quiz';

const StudentDashboard: React.FC = () => {
    const dispatch = useDispatch();
    const { student, recommendations, isLoading } = useSelector((state: RootState) => state.app);

    const [activeContent, setActiveContent] = useState<Recommendation | null>(null);
    const [quizMode, setQuizMode] = useState(false);

    const DEMO_STUDENT_ID = 'sam';

    useEffect(() => {
        const fetchData = async () => {
            dispatch(setLoading(true));
            try {
                const studentData = await api.getStudentState(DEMO_STUDENT_ID);
                dispatch(setStudent({
                    id: DEMO_STUDENT_ID,
                    profile: { name: 'Sam', grade_level: '10', learning_style: 'visual' },
                    knowledgeState: studentData.knowledge_state,
                    struggleAreas: [],
                    totalInteractions: studentData.interactions?.length || 0,
                    lastInteraction: new Date().toISOString()
                }));

                const recs = await api.getRecommendations(DEMO_STUDENT_ID, 5, studentData.knowledge_state);
                dispatch(setRecommendations(recs));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                dispatch(setLoading(false));
            }
        };
        fetchData();
    }, [dispatch]);

    const handleStartContent = (rec: Recommendation) => {
        setActiveContent(rec);
        setQuizMode(false);
    };

    const handleContentComplete = (data: CompletionData) => {
        console.log("Content completed", data);
        setQuizMode(true);
    };

    const handleQuizComplete = async (result: QuizResult) => {
        console.log("Quiz completed", result);

        if (activeContent) {
            try {
                await api.logInteraction(
                    DEMO_STUDENT_ID,
                    activeContent.content_id,
                    result.raw_score > 0.6,
                    result.completion_time,
                    activeContent.difficulty
                );
            } catch (e) {
                console.error("Failed to log interaction", e);
            }
        }

        alert(`Quiz Complete! Score: ${(result.raw_score * 100).toFixed(0)}%.`);
        setActiveContent(null);
        setQuizMode(false);
    };

    const handleBack = () => {
        setActiveContent(null);
        setQuizMode(false);
    };

    if (isLoading) {
        return (
            <Box sx={{ p: 4 }}>
                <Skeleton variant="text" sx={{ fontSize: '3rem', width: '40%', mb: 4, bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid size={{ xs: 6, md: 3 }} key={i}>
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)' }} />
                        </Grid>
                    ))}
                </Grid>
                <Skeleton variant="text" sx={{ fontSize: '2rem', width: '20%', mt: 4, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 4 }} key={i}>
                            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)' }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (!student) return <Typography>No student data found.</Typography>;

    // Active Study Mode
    if (activeContent) {
        return (
            <Box sx={{ p: 2, position: 'relative' }} className="animate-in">
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                    <IconButton
                        onClick={handleBack}
                        sx={{
                            bgcolor: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' }
                        }}
                    >
                        <ArrowBackIcon sx={{ color: 'primary.light' }} />
                    </IconButton>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.muted', letterSpacing: 1, textTransform: 'uppercase' }}>
                            {quizMode ? 'Assessment' : 'Learning'}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {activeContent.concept_name}
                        </Typography>
                    </Box>
                </Box>

                {!quizMode ? (
                    <ContentViewer
                        contentId={activeContent.content_id}
                        studentId={DEMO_STUDENT_ID}
                        contentType={activeContent.content_type}
                        title={activeContent.concept_name}
                        onComplete={handleContentComplete}
                        onProgress={(p) => console.log(`Progress: ${p}%`)}
                    />
                ) : (
                    <AdaptiveQuiz
                        quizId={`quiz_${Date.now()}`}
                        studentId={DEMO_STUDENT_ID}
                        conceptId={activeContent.concept_id.toString()}
                        targetDifficulty={activeContent.difficulty}
                        onComplete={handleQuizComplete}
                    />
                )}

                <TutorChat
                    studentId={DEMO_STUDENT_ID}
                    currentConceptId={activeContent.concept_name}
                    context={quizMode ? 'quiz' : 'content'}
                />
            </Box>
        );
    }

    // Default Dashboard View
    const avgMastery = student.knowledgeState.reduce((a, b) => a + b, 0) / student.knowledgeState.length;
    const masteredCount = student.knowledgeState.filter(k => k > 0.7).length;

    const statCards = [
        {
            label: 'Overall Mastery',
            value: `${(avgMastery * 100).toFixed(0)}%`,
            subtitle: '',
            icon: <TrendingUpIcon />,
            color: '#2D5A3D',
            glow: 'rgba(45, 90, 61, 0.1)',
        },
        {
            label: 'Concepts Mastered',
            value: `${masteredCount}`,
            subtitle: `of ${student.knowledgeState.length} concepts`,
            icon: <AutoAwesomeIcon />,
            color: '#2563EB',
            glow: 'rgba(37, 99, 235, 0.1)',
        },
        {
            label: 'Day Streak',
            value: '5',
            subtitle: 'days in a row',
            icon: <LocalFireDepartmentIcon />,
            color: '#D97706',
            glow: 'rgba(217, 119, 6, 0.1)',
        },
        {
            label: 'Total XP',
            value: '1,250',
            subtitle: 'points earned',
            icon: <EmojiEventsIcon />,
            color: '#B45309',
            glow: 'rgba(180, 83, 9, 0.1)',
        },
    ];

    const contentTypeEmoji: Record<string, string> = {
        video: '🎬',
        quiz: '📝',
        reading: '📖',
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: 'background.default' }}>

            {/* ── Header ── */}
            <Box className="animate-in" sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontFamily: '"Playfair Display", serif',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mb: 0.5,
                                color: '#1A1A1A',
                                fontStyle: 'italic',
                            }}
                        >
                            Welcome back, {student.profile.name}
                            <Chip
                                icon={<LocalFireDepartmentIcon sx={{ fontSize: 16 }} />}
                                label="5-day streak"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(217, 119, 6, 0.1)',
                                    color: '#D97706',
                                    border: '1px solid rgba(217, 119, 6, 0.2)',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    '& .MuiChip-icon': { color: '#D97706' },
                                }}
                            />
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#5C5C5C', mt: 0.5 }}>
                            You're <Box component="span" sx={{ color: '#2D5A3D', fontWeight: 700 }}>{(avgMastery * 100).toFixed(0)}%</Box> through your core curriculum. Keep it going.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Stat Cards ── */}
            <Grid container spacing={2.5} sx={{ mb: 5 }}>
                {statCards.map((stat, index) => (
                    <Grid size={{ xs: 6, md: 3 }} key={index}>
                        <Card
                            className={`animate-in animate-in-delay-${index + 1}`}
                            sx={{
                                p: 0,
                                position: 'relative',
                                overflow: 'hidden',
                                bgcolor: '#FFFFFF',
                                border: '1px solid rgba(0,0,0,0.08)',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 24px ${stat.glow}`,
                                }
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#8C8C8C', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                            {stat.label}
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                                            {stat.value}
                                        </Typography>
                                        {stat.subtitle && (
                                            <Typography sx={{ color: '#8C8C8C', fontSize: '0.75rem', mt: 0.3 }}>
                                                {stat.subtitle}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{
                                        width: 44, height: 44, borderRadius: 2.5,
                                        bgcolor: `${stat.color}10`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: stat.color,
                                    }}>
                                        {stat.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* ── Today's Focus - Recommendations ── */}
            <Box sx={{ mb: 5 }} className="animate-in animate-in-delay-2">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            AI-POWERED
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                            Today's Focus
                        </Typography>
                    </Box>
                    <Button
                        variant="text"
                        size="small"
                        endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                        sx={{ fontSize: '0.8rem', color: '#2D5A3D', fontWeight: 600 }}
                    >
                        View all
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {recommendations.slice(0, 3).map((rec, index) => (
                        <Grid size={{ xs: 12, md: 4 }} key={index}>
                            <Card
                                className={`animate-in animate-in-delay-${index + 2}`}
                                onClick={() => handleStartContent(rec)}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    bgcolor: '#FFFFFF',
                                    border: index === 0
                                        ? '1px solid rgba(45, 90, 61, 0.25)'
                                        : '1px solid rgba(0, 0, 0, 0.08)',
                                    ...(index === 0 && {
                                        boxShadow: '0 2px 12px rgba(45, 90, 61, 0.08)',
                                    }),
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        borderColor: 'rgba(45, 90, 61, 0.3)',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                                    }
                                }}
                            >

                                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start' }}>
                                        <Box>
                                            {index === 0 && (
                                                <Chip
                                                    label="RECOMMENDED"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(45, 90, 61, 0.1)',
                                                        color: '#2D5A3D',
                                                        fontWeight: 700,
                                                        fontSize: '0.6rem',
                                                        height: 22,
                                                        mb: 1,
                                                        letterSpacing: 1,
                                                    }}
                                                />
                                            )}
                                            <Typography variant="h6" sx={{ lineHeight: 1.3, fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                                                {rec.concept_name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{
                                            fontSize: 28,
                                            opacity: 0.7,
                                        }}>
                                            {contentTypeEmoji[rec.content_type] || '📚'}
                                        </Box>
                                    </Box>

                                    <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', mb: 2 }} />

                                    {/* Difficulty bar */}
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="caption" sx={{ color: '#8C8C8C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.62rem' }}>Difficulty</Typography>
                                            <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 700 }}>{(rec.difficulty * 10).toFixed(1)} / 10</Typography>
                                        </Box>
                                        <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                width: `${rec.difficulty * 100}%`,
                                                height: '100%',
                                                borderRadius: 2,
                                                background: rec.difficulty > 0.7
                                                    ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                                                    : rec.difficulty > 0.4
                                                        ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                                                        : 'linear-gradient(90deg, #2D5A3D, #4A8C62)',
                                                transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1)',
                                            }} />
                                        </Box>
                                    </Box>

                                    {/* Metadata row */}
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                                        <Typography variant="caption" sx={{ color: 'text.muted' }}>⏱ ~15 min</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.muted', textTransform: 'capitalize' }}>📺 {rec.content_type}</Typography>
                                    </Box>

                                    {/* AI Explanation */}
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: 'rgba(45, 90, 61, 0.04)',
                                        borderRadius: 2,
                                        borderLeft: '3px solid rgba(45, 90, 61, 0.3)',
                                    }}>
                                        <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5, fontSize: '0.6rem' }}>
                                            WHY THIS? →
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#5C5C5C', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                            {rec.explanation}
                                        </Typography>
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ p: 2.5, pt: 0 }}>
                                    <Button
                                        variant={index === 0 ? "contained" : "outlined"}
                                        color="primary"
                                        fullWidth
                                        onClick={() => handleStartContent(rec)}
                                        endIcon={<PlayCircleOutlineIcon />}
                                        sx={{
                                            fontWeight: 700,
                                            py: 1.2,
                                            ...(index === 0 && {
                                                background: '#2D5A3D',
                                                boxShadow: '0 4px 12px rgba(45, 90, 61, 0.2)',
                                                '&:hover': {
                                                    background: '#1B4332',
                                                    boxShadow: '0 6px 18px rgba(45, 90, 61, 0.3)',
                                                }
                                            }),
                                            ...(index !== 0 && {
                                                borderColor: 'rgba(45, 90, 61, 0.3)',
                                                color: '#2D5A3D',
                                                '&:hover': {
                                                    borderColor: '#2D5A3D',
                                                    bgcolor: 'rgba(45, 90, 61, 0.04)',
                                                }
                                            }),
                                        }}
                                    >
                                        Start Learning
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* ── Middle Section: Map & Achievements ── */}
            <Grid container spacing={4} className="animate-in animate-in-delay-4">
                <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                PROGRESS
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                                Your Knowledge Map
                            </Typography>
                        </Box>
                        <Button variant="text" size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={{ color: '#2D5A3D', fontWeight: 600 }}>
                            Expand
                        </Button>
                    </Box>
                    <Box sx={{
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        height: 400,
                        bgcolor: '#FFFFFF',
                    }}>
                        <ProgressMap />
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    GAMIFICATION
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                                    Achievements
                                </Typography>
                            </Box>
                            <Button variant="text" size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={{ color: '#2D5A3D', fontWeight: 600 }}>
                                All
                            </Button>
                        </Box>
                        <Achievements />
                    </Box>
                    <Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                SOCIAL
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                                Community
                            </Typography>
                        </Box>
                        <StudyGroups />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StudentDashboard;
