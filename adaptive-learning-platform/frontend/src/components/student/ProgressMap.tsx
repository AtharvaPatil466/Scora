import React, { useRef, useState } from 'react';
import { Box, Typography, Paper, IconButton, Chip, LinearProgress } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

interface MapNode {
    id: string;
    label: string;
    x: number;
    y: number;
    status: 'mastered' | 'ready' | 'locked';
    mastery: number;
}

interface MapEdge {
    source: string;
    target: string;
}

const mockNodes: MapNode[] = [
    { id: '1', label: 'Basic Addition', x: 20, y: 50, status: 'mastered', mastery: 0.9 },
    { id: '2', label: 'Basic Subtraction', x: 20, y: 150, status: 'mastered', mastery: 0.85 },
    { id: '3', label: 'Early Multiplication', x: 140, y: 100, status: 'mastered', mastery: 0.8 },
    { id: '4', label: 'Basic Division', x: 270, y: 100, status: 'ready', mastery: 0.4 },
    { id: '5', label: 'Fractions', x: 400, y: 50, status: 'locked', mastery: 0.1 },
    { id: '6', label: 'Decimals', x: 400, y: 150, status: 'locked', mastery: 0.05 },
    { id: '7', label: 'Basic Equations', x: 530, y: 100, status: 'locked', mastery: 0.0 },
];

const mockEdges: MapEdge[] = [
    { source: '1', target: '3' },
    { source: '2', target: '3' },
    { source: '3', target: '4' },
    { source: '4', target: '5' },
    { source: '4', target: '6' },
    { source: '5', target: '7' },
    { source: '6', target: '7' },
];

export const ProgressMap: React.FC = () => {
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));

    const getNodeColor = (status: string) => {
        switch (status) {
            case 'mastered': return '#38BDF8';
            case 'ready': return '#F59E0B';
            case 'locked': default: return '#475569';
        }
    };

    const getNodeGlow = (status: string) => {
        switch (status) {
            case 'mastered': return '0 0 12px rgba(56, 189, 248, 0.3)';
            case 'ready': return '0 0 16px rgba(245, 158, 11, 0.3)';
            default: return 'none';
        }
    };

    return (
        <Paper elevation={0} sx={{
            p: 2, height: 400, position: 'relative', overflow: 'hidden',
            bgcolor: 'transparent',
            border: 'none',
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, zIndex: 10, position: 'relative' }}>
                <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary' }}>Learning Journey</Typography>
                <Box>
                    <IconButton onClick={handleZoomOut} size="small" sx={{ color: 'text.muted', '&:hover': { color: 'text.primary' } }}>
                        <ZoomOutIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={handleZoomIn} size="small" sx={{ color: 'text.muted', '&:hover': { color: 'text.primary' } }}>
                        <ZoomInIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <Box
                ref={containerRef}
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0, left: 0,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' }
                }}
            >
                <Box
                    sx={{
                        width: 800,
                        height: 400,
                        position: 'absolute',
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                    {/* Edges */}
                    <svg width="800" height="400" style={{ position: 'absolute', top: 0, left: 0 }}>
                        {mockEdges.map((edge, i) => {
                            const sourceNode = mockNodes.find(n => n.id === edge.source);
                            const targetNode = mockNodes.find(n => n.id === edge.target);
                            if (!sourceNode || !targetNode) return null;

                            const isLocked = targetNode.status === 'locked';

                            return (
                                <line
                                    key={i}
                                    x1={sourceNode.x + 60}
                                    y1={sourceNode.y + 25}
                                    x2={targetNode.x}
                                    y2={targetNode.y + 25}
                                    stroke={isLocked ? 'rgba(255,255,255,0.06)' : 'rgba(59, 130, 246, 0.25)'}
                                    strokeWidth="2"
                                    strokeDasharray={isLocked ? "6,4" : "none"}
                                />
                            );
                        })}
                    </svg>

                    {/* Nodes */}
                    {mockNodes.map((node) => (
                        <Box
                            key={node.id}
                            sx={{
                                position: 'absolute',
                                left: node.x,
                                top: node.y,
                                width: 120,
                                textAlign: 'center'
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    bgcolor: node.status === 'locked' ? 'rgba(255,255,255,0.02)' : 'rgba(10, 10, 15, 0.7)',
                                    border: `2px solid ${getNodeColor(node.status)}`,
                                    borderColor: node.status === 'locked' ? 'rgba(255,255,255,0.08)' : getNodeColor(node.status),
                                    opacity: node.status === 'locked' ? 0.5 : 1,
                                    borderRadius: 2.5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: getNodeGlow(node.status),
                                    backdropFilter: 'blur(8px)',
                                    transition: 'all 250ms ease',
                                    '&:hover': {
                                        transform: node.status !== 'locked' ? 'scale(1.05)' : 'none',
                                    },
                                }}
                            >
                                <Typography variant="caption" fontWeight="bold" noWrap sx={{ width: '100%', color: 'text.primary', fontSize: '0.7rem' }}>
                                    {node.label}
                                </Typography>
                                {node.status !== 'locked' && (
                                    <LinearProgress
                                        variant="determinate"
                                        value={node.mastery * 100}
                                        sx={{
                                            width: '80%', mt: 1, height: 3, borderRadius: 2,
                                            bgcolor: 'rgba(255,255,255,0.06)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 2,
                                                background: node.status === 'mastered'
                                                    ? 'linear-gradient(90deg, #38BDF8, #7DD3FC)'
                                                    : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                                            }
                                        }}
                                    />
                                )}
                            </Paper>
                            {node.status === 'ready' && (
                                <Chip
                                    label="You are here"
                                    size="small"
                                    sx={{
                                        mt: 0.5,
                                        fontSize: '0.55rem',
                                        height: 18,
                                        bgcolor: 'rgba(245, 158, 11, 0.15)',
                                        color: '#FBBF24',
                                        fontWeight: 700,
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        animation: 'pulseGlow 3s ease-in-out infinite',
                                    }}
                                />
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Paper>
    );
};

export default ProgressMap;
