import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, LinearProgress, Chip, Collapse, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TimerIcon from '@mui/icons-material/Timer';
import { QuizProps, QuizResult, QuizQuestionResult } from '../../types/quiz';

const getQuestion = (difficulty: number, index: number) => {
    return {
        id: `q_${index}_${Date.now()}`,
        text: `Adaptive Question ${index + 1} (Difficulty: ${difficulty.toFixed(2)})`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        hints: [
            "Think about the foundational rule we just covered.",
            "Try to eliminate the obvious wrong answers like C and D.",
            "The answer usually starts with A."
        ],
        expectedTime: 30
    };
};

export const AdaptiveQuiz: React.FC<QuizProps> = ({ quizId, studentId, conceptId, targetDifficulty, maxQuestions = 5, onComplete }) => {
    const [currentDifficulty, setCurrentDifficulty] = useState(targetDifficulty);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(getQuestion(targetDifficulty, 0));

    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [hintsUsed, setHintsUsed] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());

    const [results, setResults] = useState<QuizQuestionResult[]>([]);
    const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
    const [consecutiveWrong, setConsecutiveWrong] = useState(0);

    // UI States
    const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            if (feedbackState === 'idle') setTimeElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [feedbackState]);

    const handleNextQuestion = () => {
        if (questionIndex + 1 >= maxQuestions || consecutiveCorrect >= 3 || consecutiveWrong >= 3) {
            finishQuiz();
            return;
        }
        setQuestionIndex(prev => prev + 1);
        setCurrentQuestion(getQuestion(currentDifficulty, questionIndex + 1));
        setSelectedAnswer('');
        setHintsUsed(0);
        setAttempts(0);
        setFeedbackState('idle');
        setStartTime(Date.now());
        setTimeElapsed(0);
    };

    const finishQuiz = () => {
        const totalCorrect = results.filter(r => r.is_correct).length;
        const raw_score = totalCorrect / results.length;
        let perf = raw_score;
        results.forEach(r => {
            perf *= Math.pow(0.9, r.hints_used);
            perf *= Math.pow(0.95, Math.max(0, r.attempts - 1));
        });
        const completionTime = results.reduce((acc, r) => acc + r.time_spent, 0);

        onComplete({
            quiz_id: quizId,
            student_id: studentId,
            concept_id: conceptId,
            questions: results,
            raw_score,
            final_performance: Math.max(0, perf),
            mastery_delta: raw_score > 0.6 ? 0.1 : -0.05,
            completion_time: completionTime,
            frustration_detected: consecutiveWrong >= 3,
            learning_style_signals: { visual_affinity: 0.5, verbal_affinity: 0.5, interactive_affinity: 0.8 }
        });
    };

    const handleSubmit = () => {
        if (!selectedAnswer) return;

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const newAttempts = attempts + 1;
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        if (isCorrect) {
            setFeedbackState('correct');
            setConsecutiveCorrect(prev => prev + 1);
            setConsecutiveWrong(0);
            setCurrentDifficulty(prev => Math.min(1.0, prev + 0.1));

            setResults(prev => [...prev, {
                question_id: currentQuestion.id,
                student_answer: selectedAnswer,
                correct_answer: currentQuestion.correctAnswer,
                is_correct: true,
                time_spent: timeSpent,
                hints_used: hintsUsed,
                attempts: newAttempts
            }]);

            setTimeout(handleNextQuestion, 2000);
        } else {
            setFeedbackState('incorrect');
            setConsecutiveWrong(prev => prev + 1);
            setConsecutiveCorrect(0);
            setCurrentDifficulty(prev => Math.max(0.1, prev - 0.15));
            setAttempts(newAttempts);
        }
    };

    const difficultyLabel = currentDifficulty > 0.7 ? 'Hard' : currentDifficulty > 0.4 ? 'Medium' : 'Easy';
    const difficultyColor = currentDifficulty > 0.7 ? '#EF4444' : currentDifficulty > 0.4 ? '#F59E0B' : '#38BDF8';

    return (
        <Paper
            elevation={0}
            sx={{
                maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 }, mt: 4,
                bgcolor: 'rgba(10, 10, 15, 0.6)',
                backdropFilter: 'blur(16px)',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
                overflow: 'hidden',
            }}
            className="animate-in"
        >
            {/* Top gradient line */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #3B82F6, #38BDF8, #F59E0B)',
            }} />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, letterSpacing: 2, fontSize: '0.6rem' }}>
                        ASSESSMENT
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mt: 0.3 }}>
                        Adaptive Quiz
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                        label={difficultyLabel}
                        size="small"
                        sx={{
                            bgcolor: `${difficultyColor}15`,
                            color: difficultyColor,
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            border: `1px solid ${difficultyColor}30`,
                        }}
                    />
                    <Chip
                        label={`${questionIndex + 1}/${maxQuestions}`}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(59, 130, 246, 0.12)',
                            color: 'primary.light',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                        }}
                    />
                </Box>
            </Box>

            {/* Progress Track */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {Array.from({ length: maxQuestions }, (_, i) => (
                        <Box
                            key={i}
                            sx={{
                                flex: 1, height: 4, borderRadius: 2,
                                bgcolor: i < questionIndex
                                    ? 'secondary.main'
                                    : i === questionIndex
                                        ? 'primary.main'
                                        : 'rgba(255,255,255,0.08)',
                                transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                                ...(i === questionIndex && {
                                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
                                }),
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Question Box */}
            <Typography variant="h5" color="text.primary" sx={{ mb: 4, lineHeight: 1.5, minHeight: 80, fontWeight: 600 }}>
                {currentQuestion.text}
            </Typography>

            {/* Options */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                {currentQuestion.options.map((opt, i) => {
                    const isSelected = selectedAnswer === opt;
                    const letter = String.fromCharCode(65 + i);
                    const isCorrectAnswer = feedbackState === 'correct' && opt === currentQuestion.correctAnswer;

                    return (
                        <Box
                            key={i}
                            onClick={() => feedbackState !== 'correct' && setSelectedAnswer(opt)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: isCorrectAnswer
                                    ? 'secondary.main'
                                    : isSelected
                                        ? 'primary.main'
                                        : 'rgba(255,255,255,0.08)',
                                bgcolor: isCorrectAnswer
                                    ? 'rgba(56, 189, 248, 0.08)'
                                    : isSelected
                                        ? 'rgba(59, 130, 246, 0.08)'
                                        : 'transparent',
                                cursor: feedbackState === 'correct' ? 'default' : 'pointer',
                                transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    borderColor: feedbackState !== 'correct' ? 'rgba(59, 130, 246, 0.4)' : undefined,
                                    transform: feedbackState !== 'correct' ? 'translateX(6px)' : 'none',
                                    bgcolor: feedbackState !== 'correct' && !isSelected ? 'rgba(255,255,255,0.02)' : undefined,
                                },
                                ...(isCorrectAnswer && {
                                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
                                }),
                            }}
                        >
                            <Box sx={{
                                width: 36, height: 36, borderRadius: 2.5,
                                border: '2px solid',
                                borderColor: isCorrectAnswer ? 'secondary.main' : isSelected ? 'primary.main' : 'rgba(255,255,255,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
                                bgcolor: isCorrectAnswer ? 'rgba(56, 189, 248, 0.15)' : isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: isCorrectAnswer ? 'secondary.main' : isSelected ? 'primary.light' : 'text.muted',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                transition: 'all 200ms ease',
                            }}>
                                {isCorrectAnswer ? '✓' : isSelected ? '●' : letter}
                            </Box>
                            <Typography variant="body1" sx={{
                                color: isCorrectAnswer ? 'secondary.light' : isSelected ? 'text.primary' : 'text.secondary',
                                fontWeight: isSelected ? 600 : 400,
                            }}>
                                {opt}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* Feedback */}
            <Collapse in={feedbackState !== 'idle'}>
                {feedbackState === 'correct' && (
                    <Box sx={{
                        p: 3, mb: 3, borderRadius: 3,
                        bgcolor: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex', alignItems: 'center', gap: 2,
                        animation: 'fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
                    }}>
                        <CheckCircleOutlineIcon sx={{ color: '#38BDF8', fontSize: 44 }} />
                        <Box>
                            <Typography variant="h6" sx={{ color: '#38BDF8', fontWeight: 700 }}>Correct! 🎉</Typography>
                            <Typography variant="body2" color="text.secondary">+15% mastery • Moving to next question...</Typography>
                        </Box>
                    </Box>
                )}
                {feedbackState === 'incorrect' && (
                    <Box sx={{
                        p: 3, mb: 3, borderRadius: 3,
                        bgcolor: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex', alignItems: 'flex-start', gap: 2,
                        animation: 'fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
                    }}>
                        <SmartToyIcon sx={{ color: '#EF4444', fontSize: 40, mt: 0.5 }} />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 700 }}>Not quite</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Let's think about this together. I've sent a hint to your TutorChat.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setFeedbackState('idle')}
                                    sx={{
                                        bgcolor: 'rgba(59, 130, 246, 0.2)',
                                        color: 'primary.light',
                                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.3)' },
                                        boxShadow: 'none',
                                    }}
                                >
                                    ↻ Try Again
                                </Button>
                                <Button size="small" sx={{ color: 'text.muted' }} onClick={handleNextQuestion}>Skip →</Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Collapse>

            {/* Hints */}
            <Collapse in={hintsUsed > 0}>
                <Box sx={{
                    mb: 3, p: 2.5, borderRadius: 2,
                    bgcolor: 'rgba(245, 158, 11, 0.06)',
                    borderLeft: '3px solid rgba(245, 158, 11, 0.4)',
                }}>
                    <Typography variant="subtitle2" sx={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontWeight: 700 }}>
                        <LightbulbIcon sx={{ fontSize: 18 }} /> Hints Revealed
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {currentQuestion.hints.slice(0, hintsUsed).map((hint, i) => (
                            <li key={i}><Typography variant="body2" color="text.secondary">{hint}</Typography></li>
                        ))}
                    </Box>
                </Box>
            </Collapse>

            {/* Bottom Controls */}
            <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                pt: 3, borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
                <Button
                    variant="outlined"
                    onClick={() => setHintsUsed(h => h + 1)}
                    disabled={hintsUsed >= currentQuestion.hints.length || feedbackState === 'correct'}
                    startIcon={<LightbulbIcon sx={{ fontSize: 16 }} />}
                    sx={{
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                        color: '#F59E0B',
                        '&:hover': { borderColor: 'rgba(245, 158, 11, 0.5)', bgcolor: 'rgba(245, 158, 11, 0.05)' },
                        '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.06)', color: 'text.muted' },
                    }}
                >
                    Use Hint (−5%)
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimerIcon sx={{ fontSize: 16, color: 'text.muted' }} />
                        <Typography variant="caption" sx={{ color: 'text.muted', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                            {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={!selectedAnswer || feedbackState !== 'idle'}
                        sx={{
                            px: 4, py: 1.5, fontWeight: 700, borderRadius: 3,
                            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                            },
                            '&.Mui-disabled': {
                                background: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.25)',
                                boxShadow: 'none',
                            }
                        }}
                    >
                        Submit Answer →
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default AdaptiveQuiz;
