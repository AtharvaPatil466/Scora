import React, { useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

const DemoMode: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [setupDone, setSetupDone] = useState(false);

    const handleSetup = async () => {
        setLoading(true);
        try {
            await axios.get('http://localhost:8000/demo/setup');
            setSetupDone(true);
        } catch (e) {
            console.error(e);
            alert("Failed to setup demo mode. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }} className="animate-in">
            <Paper elevation={0} sx={{
                p: 5, textAlign: 'center',
                bgcolor: 'rgba(10, 10, 15, 0.6)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Top gradient */}
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, #3B82F6, #38BDF8)',
                }} />

                <Box sx={{
                    width: 64, height: 64, borderRadius: 3, mx: 'auto', mb: 3,
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(56, 189, 248, 0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                }}>
                    <RocketLaunchIcon sx={{ fontSize: 32, color: 'primary.light' }} />
                </Box>

                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Demo Environment
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.7 }}>
                    Initialize the backend with mock students. This provides varied data for the Knowledge Graph, Recommendations, and Analytics.
                </Typography>

                {setupDone && (
                    <Alert
                        icon={<CheckCircleIcon sx={{ color: '#38BDF8' }} />}
                        sx={{
                            mb: 3,
                            bgcolor: 'rgba(56, 189, 248, 0.08)',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            color: '#38BDF8',
                            borderRadius: 3,
                            animation: 'fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
                        }}
                    >
                        Mock students initialized! Dashboard is loaded with 'sam' for demo.
                    </Alert>
                )}

                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSetup}
                    disabled={loading || setupDone}
                    sx={{
                        mb: 2.5, px: 4, py: 1.5, fontWeight: 700, borderRadius: 3,
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                        },
                        '&.Mui-disabled': {
                            background: setupDone ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.06)',
                            color: setupDone ? '#38BDF8' : 'rgba(255,255,255,0.25)',
                            boxShadow: 'none',
                        }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : setupDone ? "✓ Initialized" : "Initialize Mock Data"}
                </Button>

                <Typography variant="caption" sx={{ color: 'text.muted', display: 'block' }}>
                    Creates 'alex' (beginner) · 'sam' (intermediate) · 'jo' (advanced)
                </Typography>
            </Paper>
        </Box>
    );
};

export default DemoMode;
