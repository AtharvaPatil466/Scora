import React from 'react';
import { Box, Typography, Paper, Card, CardContent } from '@mui/material';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const mockProgressData = [
    { session: 'Mon', 'Math': 0.1, 'Science': 0.05 },
    { session: 'Tue', 'Math': 0.15, 'Science': 0.1 },
    { session: 'Wed', 'Math': 0.25, 'Science': 0.2 },
    { session: 'Thu', 'Math': 0.35, 'Science': 0.25 },
    { session: 'Fri', 'Math': 0.45, 'Science': 0.4 },
    { session: 'Sat', 'Math': 0.55, 'Science': 0.5 },
];

const ProgressTracker: React.FC = () => {
    const statItems = [
        { label: 'Sessions This Week', value: '6', color: '#3B82F6' },
        { label: 'Avg. Mastery Growth', value: '+8%', color: '#38BDF8' },
        { label: 'Time Spent', value: '4.2h', color: '#F59E0B' },
    ];

    return (
        <Box sx={{ p: 4 }} className="animate-in">
            <Box sx={{ mb: 4 }}>
                <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, letterSpacing: 2, fontSize: '0.65rem' }}>
                    ANALYTICS
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                    Learning Trajectory
                </Typography>
            </Box>

            {/* Stats Row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                {statItems.map((stat, i) => (
                    <Card
                        key={i}
                        className={`animate-in animate-in-delay-${i + 1}`}
                        sx={{
                            flex: 1, position: 'relative', overflow: 'hidden',
                            bgcolor: 'rgba(10, 10, 15, 0.6)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${stat.color}, transparent)` }} />
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                {stat.label}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                                {stat.value}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Chart */}
            <Paper
                elevation={0}
                sx={{
                    p: 3, height: 400, borderRadius: 3,
                    bgcolor: 'rgba(10, 10, 15, 0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}
                className="animate-in animate-in-delay-3"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={mockProgressData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="gradMath" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradScience" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="session" stroke="#64748B" fontSize={12} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                        <YAxis domain={[0, 1]} stroke="#64748B" fontSize={12} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#111114',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            }}
                            labelStyle={{ color: '#F8FAFC', fontWeight: 600 }}
                            itemStyle={{ color: '#94A3B8' }}
                            formatter={(value: number | undefined) => `${((value || 0) * 100).toFixed(1)}% Mastery`}
                        />
                        <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
                        <Area type="monotone" dataKey="Math" stroke="#3B82F6" strokeWidth={3} fill="url(#gradMath)" activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="Science" stroke="#38BDF8" strokeWidth={3} fill="url(#gradScience)" activeDot={{ r: 6, fill: '#38BDF8', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </Paper>
        </Box>
    );
};

export default ProgressTracker;
