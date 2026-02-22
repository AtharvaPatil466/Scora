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
        { label: 'Sessions This Week', value: '6', color: '#2D5A3D' },
        { label: 'Avg. Mastery Growth', value: '+8%', color: '#2D5A3D' },
        { label: 'Time Spent', value: '4.2h', color: '#D97706' },
    ];

    return (
        <Box sx={{ p: 4 }} className="animate-in">
            <Box sx={{ mb: 4 }}>
                <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, fontSize: '0.65rem' }}>
                    ANALYTICS
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
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
                            bgcolor: '#FFFFFF',
                            border: '1px solid rgba(0,0,0,0.08)',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            }
                        }}
                    >
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" sx={{ color: '#8C8C8C', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                {stat.label}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
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
                    bgcolor: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.08)',
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
                                <stop offset="5%" stopColor="#2D5A3D" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#2D5A3D" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradScience" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4A8C62" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#4A8C62" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="session" stroke="#8C8C8C" fontSize={12} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.08)' }} />
                        <YAxis domain={[0, 1]} stroke="#8C8C8C" fontSize={12} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.08)' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid rgba(0,0,0,0.08)',
                                borderRadius: 8,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            }}
                            labelStyle={{ color: '#1A1A1A', fontWeight: 600 }}
                            itemStyle={{ color: '#5C5C5C' }}
                            formatter={(value: number | undefined) => `${((value || 0) * 100).toFixed(1)}% Mastery`}
                        />
                        <Legend wrapperStyle={{ color: '#5C5C5C', fontSize: 12 }} />
                        <Area type="monotone" dataKey="Math" stroke="#2D5A3D" strokeWidth={3} fill="url(#gradMath)" activeDot={{ r: 6, fill: '#2D5A3D', stroke: '#fff', strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="Science" stroke="#4A8C62" strokeWidth={3} fill="url(#gradScience)" activeDot={{ r: 6, fill: '#4A8C62', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </Paper>
        </Box>
    );
};

export default ProgressTracker;
