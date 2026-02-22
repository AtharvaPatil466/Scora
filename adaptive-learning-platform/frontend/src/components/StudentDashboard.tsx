import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    Box, Typography, Card, CardContent, CircularProgress,
    Button, CardActions, Chip, Divider, Skeleton, IconButton,
    LinearProgress, Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import BoltIcon from '@mui/icons-material/Bolt';
import Grid from '@mui/material/Grid2';
import {
    setStudent, setRecommendations, setLoading
} from '../store';
import * as api from '../api';
import { Recommendation, KnowledgeGraphData } from '../types';

import ContentViewer from './student/ContentViewer';
import AdaptiveQuiz from './student/AdaptiveQuiz';
import TutorChat from './student/TutorChat';
import Achievements from './student/Achievements';
import ProgressMap from './student/ProgressMap';
import StudyGroups from './student/StudyGroups';
import LearningPath from './student/LearningPath';
import MasteryRipple from './student/MasteryRipple';
import { CompletionData } from '../types/content';
import { QuizResult } from '../types/quiz';

const StudentDashboard: React.FC = () => {
    const dispatch = useDispatch();
    const { student, recommendations, isLoading } = useSelector((state: RootState) => state.app);

    const [activeContent, setActiveContent] = useState<Recommendation | null>(null);
    const [quizMode, setQuizMode] = useState(false);
    const [kgData, setKgData] = useState<KnowledgeGraphData | null>(null);
    const [feedbackSnack, setFeedbackSnack] = useState(false);
    const [rippleOpen, setRippleOpen] = useState(false);
    const [rippleData, setRippleData] = useState<{ conceptId: number; conceptName: string; score: number } | null>(null);

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

                // Fetch KG data for Top Skills card + mini graph
                try {
                    const kg = await api.getKnowledgeGraph(DEMO_STUDENT_ID);
                    setKgData(kg);
                } catch { /* KG is optional, degrade gracefully */ }
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

        // Show Mastery Ripple instead of alert
        if (kgData && activeContent) {
            setRippleData({
                conceptId: activeContent.concept_id,
                conceptName: activeContent.concept_name,
                score: result.raw_score,
            });
            setRippleOpen(true);
        } else {
            setActiveContent(null);
            setQuizMode(false);
        }
    };

    const handleBack = () => {
        setActiveContent(null);
        setQuizMode(false);
    };

    // Generate human-readable causal explanation
    const generateWhyThis = (rec: Recommendation): string => {
        const masteryPct = (rec.current_mastery * 100).toFixed(0);
        if (rec.current_mastery < 0.3) {
            return `You're at ${masteryPct}% on ${rec.concept_name} — this is a critical gap. Filling it now unlocks harder topics ahead.`;
        } else if (rec.current_mastery < 0.6) {
            return `You've started ${rec.concept_name} (${masteryPct}% mastery) but haven't locked it in yet. One focused session should get you there.`;
        } else {
            return `You're close to mastering ${rec.concept_name} at ${masteryPct}%. This session pushes you over the finish line.`;
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'rgba(45, 90, 61, 0.06)', mb: 3 }}>
                        <AutoAwesomeIcon sx={{ fontSize: 36, color: '#2D5A3D', animation: 'pulse 2s ease-in-out infinite' }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: '#1A1A1A', fontWeight: 600, fontFamily: '"Playfair Display", serif', mb: 0.5 }}>
                        Analyzing your learning profile…
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#8C8C8C' }}>
                        PEARL is generating personalized recommendations
                    </Typography>
                </Box>
                <Grid container spacing={3} sx={{ maxWidth: 900, width: '100%' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid size={{ xs: 6, md: 3 }} key={i}>
                            <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 3, bgcolor: 'rgba(45, 90, 61, 0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </Grid>
                    ))}
                </Grid>
                <Grid container spacing={3} sx={{ maxWidth: 900, width: '100%', mt: 3 }}>
                    {[1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 4 }} key={i}>
                            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3, bgcolor: 'rgba(45, 90, 61, 0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
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
                            bgcolor: 'rgba(45, 90, 61, 0.08)',
                            border: '1px solid rgba(45, 90, 61, 0.15)',
                            '&:hover': { bgcolor: 'rgba(45, 90, 61, 0.15)' }
                        }}
                    >
                        <ArrowBackIcon sx={{ color: '#2D5A3D' }} />
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

    // Compute top 3 skills from KG data
    const topSkills = kgData
        ? [...kgData.nodes]
            .sort((a, b) => b.mastery - a.mastery)
            .slice(0, 3)
        : [];

    const statCards = [
        {
            label: 'Overall Mastery',
            value: `${(avgMastery * 100).toFixed(0)}%`,
            subtitle: 'across all topics',
            icon: <TrendingUpIcon />,
            color: '#2D5A3D',
            glow: 'rgba(45, 90, 61, 0.1)',
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
            subtitle: `last: +40 XP (Counting 72%→84%)`,
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

                {/* Top Skills card (replaces Concepts Mastered) */}
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card
                        className="animate-in animate-in-delay-4"
                        sx={{
                            p: 0, position: 'relative', overflow: 'hidden',
                            bgcolor: '#FFFFFF',
                            border: '1px solid rgba(0,0,0,0.08)',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 24px rgba(45, 90, 61, 0.1)',
                            }
                        }}
                    >
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                <Typography variant="caption" sx={{ color: '#8C8C8C', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    Top Skills
                                </Typography>
                                <Box sx={{
                                    width: 44, height: 44, borderRadius: 2.5,
                                    bgcolor: 'rgba(45, 90, 61, 0.06)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#2D5A3D',
                                }}>
                                    <AutoAwesomeIcon />
                                </Box>
                            </Box>
                            {topSkills.length > 0 ? topSkills.map((skill, i) => (
                                <Box key={i} sx={{ mb: i < 2 ? 1.2 : 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#1A1A1A', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {skill.label}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#2D5A3D' }}>
                                            {(skill.mastery * 100).toFixed(0)}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={skill.mastery * 100}
                                        sx={{
                                            height: 4, borderRadius: 2,
                                            bgcolor: 'rgba(0,0,0,0.04)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 2,
                                                background: 'linear-gradient(90deg, #2D5A3D, #4A8C62)',
                                            }
                                        }}
                                    />
                                </Box>
                            )) : (
                                <Typography sx={{ fontSize: '0.75rem', color: '#8C8C8C' }}>
                                    {masteredCount} of {student.knowledgeState.length} concepts
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
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
                                            <Box sx={{ minHeight: 30 }}>
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
                                            </Box>
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

                                    {/* Stretch Level bar */}
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <BoltIcon sx={{ fontSize: 13, color: '#8C8C8C' }} />
                                                <Typography variant="caption" sx={{ color: '#8C8C8C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.62rem' }}>Stretch Level</Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#1A1A1A', fontWeight: 700 }}>{(rec.difficulty * 10).toFixed(1)} / 10</Typography>
                                        </Box>
                                        <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                            <Box sx={{
                                                width: `${rec.difficulty * 100}%`,
                                                height: '100%',
                                                borderRadius: 2,
                                                background: 'linear-gradient(90deg, #2D5A3D, #4A8C62)',
                                                transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1)',
                                            }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#8C8C8C', fontSize: '0.55rem', mt: 0.3, display: 'block' }}>CQL-validated · safe for you</Typography>
                                    </Box>

                                    {/* Metadata row */}
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                                        <Typography variant="caption" sx={{ color: '#8C8C8C' }}>⏱ ~15 min</Typography>
                                        <Typography variant="caption" sx={{ color: '#8C8C8C', textTransform: 'capitalize' }}>📺 {rec.content_type}</Typography>
                                    </Box>

                                    {/* AI Explanation — human-readable */}
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
                                            {generateWhyThis(rec)}
                                        </Typography>
                                    </Box>

                                    {/* Feedback */}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5, gap: 0.5 }}>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setFeedbackSnack(true); }} sx={{ color: '#8C8C8C', '&:hover': { color: '#2D5A3D', bgcolor: 'rgba(45,90,61,0.06)' } }}>
                                            <ThumbUpAltOutlinedIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setFeedbackSnack(true); }} sx={{ color: '#8C8C8C', '&:hover': { color: '#DC2626', bgcolor: 'rgba(220,38,38,0.06)' } }}>
                                            <ThumbDownAltOutlinedIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ p: 2.5, pt: 0 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        onClick={() => handleStartContent(rec)}
                                        endIcon={<PlayCircleOutlineIcon />}
                                        sx={{
                                            fontWeight: 700,
                                            py: 1.2,
                                            fontSize: '0.875rem',
                                            borderRadius: 2,
                                            ...(index === 0 ? {
                                                background: '#2D5A3D',
                                                color: '#FFFFFF',
                                                border: '1px solid transparent',
                                                boxShadow: '0 4px 12px rgba(45, 90, 61, 0.2)',
                                                '&:hover': {
                                                    background: '#1B4332',
                                                    boxShadow: '0 6px 18px rgba(45, 90, 61, 0.3)',
                                                }
                                            } : {
                                                background: 'rgba(45, 90, 61, 0.06)',
                                                color: '#2D5A3D',
                                                boxShadow: 'none',
                                                border: '1px solid rgba(45, 90, 61, 0.2)',
                                                '&:hover': {
                                                    background: 'rgba(45, 90, 61, 0.1)',
                                                    boxShadow: 'none',
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

            {/* ── Learning Path ── */}
            {kgData && (
                <Box sx={{ mb: 5 }} className="animate-in animate-in-delay-4">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                AI-GENERATED
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                                Your Learning Journey
                            </Typography>
                        </Box>
                        <Button variant="text" size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={{ color: '#2D5A3D', fontWeight: 600 }}>
                            Full path
                        </Button>
                    </Box>
                    <Card elevation={0} sx={{ bgcolor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', p: 3 }}>
                        <LearningPath kgData={kgData} />
                    </Card>
                </Box>
            )}

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

            {/* Feedback Snackbar */}
            <Snackbar
                open={feedbackSnack}
                autoHideDuration={2000}
                onClose={() => setFeedbackSnack(false)}
                message="Thanks! This helps PEARL learn your preferences."
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                ContentProps={{ sx: { bgcolor: '#2D5A3D', borderRadius: 2, fontWeight: 600 } }}
            />

            {/* Mastery Ripple Overlay */}
            {kgData && rippleData && (
                <MasteryRipple
                    open={rippleOpen}
                    onClose={() => {
                        setRippleOpen(false);
                        setRippleData(null);
                        setActiveContent(null);
                        setQuizMode(false);
                    }}
                    completedConceptId={rippleData.conceptId}
                    completedConceptName={rippleData.conceptName}
                    score={rippleData.score}
                    kgData={kgData}
                />
            )}
        </Box>
    );
};

export default StudentDashboard;
