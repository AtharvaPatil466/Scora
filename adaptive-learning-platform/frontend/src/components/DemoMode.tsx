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
                bgcolor: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Top gradient */}
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, #2D5A3D, #4A8C62)',
                }} />

                <Box sx={{
                    width: 64, height: 64, borderRadius: 3, mx: 'auto', mb: 3,
                    background: 'rgba(45, 90, 61, 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(45, 90, 61, 0.15)',
                }}>
                    <RocketLaunchIcon sx={{ fontSize: 32, color: '#2D5A3D' }} />
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }} gutterBottom>
                    Demo Environment
                </Typography>
                <Typography variant="body2" sx={{ color: '#5C5C5C', mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.7 }}>
                    Initialize the backend with mock students. This provides varied data for the Knowledge Graph, Recommendations, and Analytics.
                </Typography>

                {setupDone && (
                    <Alert
                        icon={<CheckCircleIcon sx={{ color: '#2D5A3D' }} />}
                        sx={{
                            mb: 3,
                            bgcolor: 'rgba(45, 90, 61, 0.06)',
                            border: '1px solid rgba(45, 90, 61, 0.15)',
                            color: '#2D5A3D',
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
                        background: '#2D5A3D',
                        boxShadow: '0 4px 16px rgba(45, 90, 61, 0.2)',
                        '&:hover': {
                            background: '#1B4332',
                            boxShadow: '0 8px 24px rgba(45, 90, 61, 0.3)',
                        },
                        '&.Mui-disabled': {
                            background: setupDone ? 'rgba(45, 90, 61, 0.08)' : 'rgba(0,0,0,0.06)',
                            color: setupDone ? '#2D5A3D' : 'rgba(0,0,0,0.25)',
                            boxShadow: 'none',
                        }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : setupDone ? "✓ Initialized" : "Initialize Mock Data"}
                </Button>

                <Typography variant="caption" sx={{ color: '#8C8C8C', display: 'block' }}>
                    Creates 'alex' (beginner) · 'sam' (intermediate) · 'jo' (advanced)
                </Typography>
            </Paper>
        </Box>
    );
};

export default DemoMode;
