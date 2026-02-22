import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, LinearProgress, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Snackbar, Alert, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRealtimeAlerts } from '../../services/websocket';

const classStats = {
    enrollment: 32,
    avgMastery: 67,
    masteryTrend: 5,
    atRiskStudents: 4,
};

const bottleneckConcepts = [
    { id: 'c1', name: 'Quadratic Formula', avgMastery: 42, timesFailed: 87, relatedContent: 'Video 4.2' },
    { id: 'c2', name: 'Systems of Equations', avgMastery: 55, timesFailed: 41, relatedContent: 'Interactive Lab 3' },
    { id: 'c3', name: 'Factoring Polynomials', avgMastery: 59, timesFailed: 30, relatedContent: 'Reading 5.1' },
];

const studentsList = [
    { id: 's1', name: 'Alex Johnson', mastery: 88, status: 'on_track', lastActive: '2 hours ago', alerts: 0 },
    { id: 's2', name: 'Sam Smith', mastery: 65, status: 'needs_attention', lastActive: '1 day ago', alerts: 1 },
    { id: 's3', name: 'Jordan Lee', mastery: 41, status: 'at_risk', lastActive: '4 days ago', alerts: 3 },
    { id: 's4', name: 'Taylor Swift', mastery: 92, status: 'on_track', lastActive: '5 mins ago', alerts: 0 },
    { id: 's5', name: 'Casey Jones', mastery: 38, status: 'at_risk', lastActive: '5 days ago', alerts: 2 },
];

const stringToColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 60%, 55%)`;
};

export const TeacherDashboard: React.FC = () => {
    const { alerts, dismissAlert, isConnected } = useRealtimeAlerts('teacher');
    const activeAlert = alerts.length > 0 ? alerts[0] : null;

    const kpiCards = [
        { label: 'Total Enrolled', value: classStats.enrollment.toString(), icon: <PeopleIcon />, color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.2)' },
        { label: 'Class Mastery', value: `${classStats.avgMastery}%`, icon: <TrendingUpIcon />, color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.2)', badge: `+${classStats.masteryTrend}%` },
        { label: 'At Risk', value: classStats.atRiskStudents.toString(), icon: <WarningAmberIcon />, color: '#EF4444', glow: 'rgba(239, 68, 68, 0.2)' },
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }} className="animate-in">
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, letterSpacing: 2, fontSize: '0.65rem' }}>
                        INSTRUCTOR
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                        Analytics Dashboard
                    </Typography>
                </Box>
                <Chip
                    label={isConnected ? "Real-time Sync" : "Connecting..."}
                    size="small"
                    sx={{
                        bgcolor: isConnected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: isConnected ? '#38BDF8' : 'text.muted',
                        border: `1px solid ${isConnected ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                        fontWeight: 600,
                        '& .MuiChip-label::before': {
                            content: '""',
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: isConnected ? '#38BDF8' : '#64748B',
                            mr: 1,
                        }
                    }}
                />
            </Box>

            <Snackbar
                open={!!activeAlert}
                autoHideDuration={60000}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                onClose={() => activeAlert && dismissAlert(activeAlert.id)}
            >
                {activeAlert ? (
                    <Alert severity={activeAlert.severity === 'high' ? 'error' : 'warning'} sx={{
                        bgcolor: activeAlert.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        border: `1px solid ${activeAlert.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        borderRadius: 3,
                        backdropFilter: 'blur(16px)',
                    }}>
                        <Typography variant="subtitle2" fontWeight="bold">{activeAlert.title}</Typography>
                        <Typography variant="body2">{activeAlert.message}</Typography>
                    </Alert>
                ) : <div />}
            </Snackbar>

            {/* KPI Cards */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {kpiCards.map((kpi, i) => (
                    <Grid size={{ xs: 12, md: 4 }} key={i}>
                        <Card
                            className={`animate-in animate-in-delay-${i + 1}`}
                            sx={{
                                position: 'relative', overflow: 'hidden',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 12px 40px ${kpi.glow}`,
                                },
                            }}
                        >
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${kpi.color}, transparent)` }} />
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                            {kpi.label}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary' }}>{kpi.value}</Typography>
                                            {kpi.badge && (
                                                <Chip label={kpi.badge} size="small" sx={{
                                                    bgcolor: 'rgba(56, 189, 248, 0.12)',
                                                    color: '#38BDF8',
                                                    fontWeight: 700,
                                                    fontSize: '0.65rem',
                                                    height: 22,
                                                }} />
                                            )}
                                        </Box>
                                    </Box>
                                    <Box sx={{
                                        width: 44, height: 44, borderRadius: 2.5,
                                        bgcolor: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: kpi.color,
                                    }}>
                                        {kpi.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={4}>
                {/* Student Roster */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">Student Roster</Typography>
                        <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />} sx={{ color: 'primary.light', fontSize: '0.8rem' }}>
                            Export
                        </Button>
                    </Box>
                    <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{
                            bgcolor: 'rgba(10, 10, 15, 0.5)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 3,
                        }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'text.muted', fontWeight: 600, fontSize: '0.7rem', letterSpacing: 0.5, textTransform: 'uppercase' } }}>
                                    <TableCell>Student</TableCell>
                                    <TableCell>Mastery</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Last Active</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {studentsList.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        sx={{
                                            '& td': { borderBottom: '1px solid rgba(255,255,255,0.03)' },
                                            transition: 'background 200ms ease',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 30, height: 30, bgcolor: stringToColor(student.name), fontSize: '0.7rem' }}>
                                                    {student.name.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{student.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={student.mastery}
                                                    sx={{
                                                        width: 80, height: 4, borderRadius: 2,
                                                        bgcolor: 'rgba(255,255,255,0.06)',
                                                        '& .MuiLinearProgress-bar': {
                                                            borderRadius: 2,
                                                            background: student.mastery > 70
                                                                ? 'linear-gradient(90deg, #38BDF8, #7DD3FC)'
                                                                : student.mastery > 50
                                                                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                                                                    : 'linear-gradient(90deg, #EF4444, #F87171)',
                                                        }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                                    {student.mastery}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {student.status === 'on_track' && <Chip label="On Track" size="small" sx={{ bgcolor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', fontWeight: 600, fontSize: '0.65rem', height: 24, border: '1px solid rgba(56, 189, 248, 0.25)' }} />}
                                            {student.status === 'needs_attention' && <Chip label="Attention" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontWeight: 600, fontSize: '0.65rem', height: 24, border: '1px solid rgba(245, 158, 11, 0.25)' }} />}
                                            {student.status === 'at_risk' && <Chip label="At Risk" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', fontWeight: 600, fontSize: '0.65rem', height: 24, border: '1px solid rgba(239, 68, 68, 0.25)' }} />}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ color: student.status === 'at_risk' ? '#EF4444' : 'text.muted' }}>
                                                {student.lastActive}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small" variant="outlined" sx={{
                                                borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', fontSize: '0.7rem',
                                                '&:hover': { borderColor: 'rgba(255,255,255,0.2)' },
                                            }}>
                                                Profile
                                            </Button>
                                            {student.status !== 'on_track' && (
                                                <Button size="small" sx={{ color: 'primary.light', ml: 1, fontSize: '0.7rem' }}>Nudge</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* Concept Bottlenecks */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Concept Bottlenecks</Typography>
                    <Card elevation={0}>
                        <CardContent>
                            <Typography variant="body2" sx={{ color: 'text.muted', mb: 3 }}>
                                Concepts where the class is struggling most, based on quiz failure rates and hint usage.
                            </Typography>

                            {bottleneckConcepts.map((concept) => (
                                <Box key={concept.id} sx={{
                                    mb: 2.5, p: 2.5, borderRadius: 3,
                                    bgcolor: 'rgba(245, 158, 11, 0.04)',
                                    borderLeft: '3px solid rgba(245, 158, 11, 0.5)',
                                    border: '1px solid rgba(245, 158, 11, 0.1)',
                                    borderLeftWidth: 3,
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.primary' }}>{concept.name}</Typography>
                                        <Chip label={`${concept.avgMastery}%`} size="small" sx={{
                                            bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                                            fontWeight: 700, fontSize: '0.65rem', height: 22,
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                        }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'text.muted' }}>
                                        Failed {concept.timesFailed} times this week across {classStats.enrollment} students
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                        <Chip label={`Review: ${concept.relatedContent}`} size="small" sx={{
                                            bgcolor: 'rgba(255,255,255,0.04)', color: 'text.secondary', fontSize: '0.65rem',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }} />
                                        <Button size="small" endIcon={<AssessmentIcon sx={{ fontSize: 14 }} />} sx={{ color: 'primary.light', fontSize: '0.75rem' }}>
                                            Analyze
                                        </Button>
                                    </Box>
                                </Box>
                            ))}

                            <Button fullWidth variant="outlined" sx={{
                                mt: 1, borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary',
                                '&:hover': { borderColor: 'rgba(255,255,255,0.2)' },
                            }}>
                                Generate Alternative Explanations
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherDashboard;
