import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Backdrop, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { KnowledgeGraphData } from '../../types';

interface MasteryRippleProps {
    open: boolean;
    onClose: () => void;
    completedConceptId: number;
    completedConceptName: string;
    score: number;
    kgData: KnowledgeGraphData;
}

interface RippleNode {
    id: number;
    label: string;
    mastery: number;
    delta: number;
    degree: number; // 0 = completed, 1 = direct neighbor, 2 = second-degree
    x: number;
    y: number;
}

const MasteryRipple: React.FC<MasteryRippleProps> = ({
    open, onClose, completedConceptId, completedConceptName, score, kgData
}) => {
    const [phase, setPhase] = useState(0); // 0=enter, 1=ripple1, 2=ripple2, 3=done

    useEffect(() => {
        if (!open) { setPhase(0); return; }
        const t1 = setTimeout(() => setPhase(1), 600);
        const t2 = setTimeout(() => setPhase(2), 1500);
        const t3 = setTimeout(() => setPhase(3), 2500);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [open]);

    if (!open) return null;

    // Compute ripple nodes from KG
    const edgesNormalized = kgData.edges.map(e => ({
        source: typeof e.source === 'object' ? (e.source as any).id : e.source,
        target: typeof e.target === 'object' ? (e.target as any).id : e.target,
    }));

    const directNeighborIds = new Set<number>();
    edgesNormalized.forEach(e => {
        if (e.source === completedConceptId) directNeighborIds.add(e.target);
        if (e.target === completedConceptId) directNeighborIds.add(e.source);
    });

    const secondDegreeIds = new Set<number>();
    edgesNormalized.forEach(e => {
        if (directNeighborIds.has(e.source) && e.target !== completedConceptId && !directNeighborIds.has(e.target)) {
            secondDegreeIds.add(e.target);
        }
        if (directNeighborIds.has(e.target) && e.source !== completedConceptId && !directNeighborIds.has(e.source)) {
            secondDegreeIds.add(e.source);
        }
    });

    const nodeMap = new Map(kgData.nodes.map(n => [n.id, n]));
    const centerNode = nodeMap.get(completedConceptId);

    // Lay out nodes in concentric circles
    const rippleNodes: RippleNode[] = [];

    if (centerNode) {
        rippleNodes.push({
            ...centerNode,
            delta: score > 0.6 ? 12 : 5,
            degree: 0,
            x: 50,
            y: 50,
        });
    }

    const neighbors = Array.from(directNeighborIds).slice(0, 6);
    neighbors.forEach((id, i) => {
        const n = nodeMap.get(id);
        if (!n) return;
        const angle = (i / neighbors.length) * Math.PI * 2 - Math.PI / 2;
        rippleNodes.push({
            ...n,
            delta: score > 0.6 ? 5 : 2,
            degree: 1,
            x: 50 + Math.cos(angle) * 25,
            y: 50 + Math.sin(angle) * 25,
        });
    });

    const seconds = Array.from(secondDegreeIds).slice(0, 8);
    seconds.forEach((id, i) => {
        const n = nodeMap.get(id);
        if (!n) return;
        const angle = (i / seconds.length) * Math.PI * 2;
        rippleNodes.push({
            ...n,
            delta: score > 0.6 ? 2 : 1,
            degree: 2,
            x: 50 + Math.cos(angle) * 42,
            y: 50 + Math.sin(angle) * 42,
        });
    });

    return (
        <Backdrop
            open={open}
            sx={{
                zIndex: 2000,
                bgcolor: 'rgba(248, 245, 240, 0.95)',
                backdropFilter: 'blur(12px)',
            }}
        >
            <Box sx={{
                width: '100%',
                maxWidth: 600,
                textAlign: 'center',
                px: 3,
            }}>
                {/* Header */}
                <Box sx={{
                    mb: 4,
                    opacity: phase >= 0 ? 1 : 0,
                    transform: phase >= 0 ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                    <AutoAwesomeIcon sx={{ fontSize: 42, color: '#2D5A3D', mb: 1 }} />
                    <Typography variant="h5" sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        mb: 0.5,
                    }}>
                        Mastery Ripple
                    </Typography>
                    <Typography sx={{ color: '#5C5C5C', fontSize: '0.9rem' }}>
                        Completing <strong>{completedConceptName}</strong> boosted connected concepts
                    </Typography>
                </Box>

                {/* Graph visualization */}
                <Box sx={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '100%',
                    mb: 3,
                }}>
                    <Box sx={{ position: 'absolute', inset: 0 }}>
                        {/* Ripple rings */}
                        {[1, 2].map(ring => (
                            <Box
                                key={ring}
                                sx={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    width: ring === 1 ? '50%' : '84%',
                                    height: ring === 1 ? '50%' : '84%',
                                    transform: 'translate(-50%, -50%)',
                                    borderRadius: '50%',
                                    border: '1px dashed',
                                    borderColor: phase >= ring
                                        ? 'rgba(45, 90, 61, 0.15)'
                                        : 'rgba(0,0,0,0.04)',
                                    transition: 'border-color 800ms ease',
                                }}
                            />
                        ))}

                        {/* Connection lines */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                            {rippleNodes.filter(n => n.degree > 0).map(n => (
                                <line
                                    key={`line-${n.id}`}
                                    x1="50%"
                                    y1="50%"
                                    x2={`${n.x}%`}
                                    y2={`${n.y}%`}
                                    stroke={phase >= n.degree ? 'rgba(45, 90, 61, 0.15)' : 'rgba(0,0,0,0.04)'}
                                    strokeWidth="1"
                                    style={{ transition: 'stroke 600ms ease' }}
                                />
                            ))}
                        </svg>

                        {/* Nodes */}
                        {rippleNodes.map(node => {
                            const isVisible = phase >= node.degree;
                            const size = node.degree === 0 ? 72 : node.degree === 1 ? 56 : 44;

                            return (
                                <Box
                                    key={node.id}
                                    sx={{
                                        position: 'absolute',
                                        left: `${node.x}%`,
                                        top: `${node.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        width: size,
                                        height: size,
                                        borderRadius: '50%',
                                        bgcolor: node.degree === 0
                                            ? '#2D5A3D'
                                            : isVisible
                                                ? 'rgba(45, 90, 61, 0.08)'
                                                : 'rgba(0,0,0,0.03)',
                                        border: isVisible
                                            ? '2px solid rgba(45, 90, 61, 0.25)'
                                            : '2px solid rgba(0,0,0,0.04)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        transitionDelay: `${node.degree * 300}ms`,
                                        opacity: isVisible ? 1 : 0.3,
                                        boxShadow: isVisible && node.degree === 0
                                            ? '0 0 24px rgba(45, 90, 61, 0.3)'
                                            : isVisible && node.degree === 1
                                                ? '0 0 12px rgba(45, 90, 61, 0.15)'
                                                : 'none',
                                    }}
                                >
                                    <Typography sx={{
                                        fontSize: node.degree === 0 ? '0.55rem' : '0.48rem',
                                        fontWeight: 700,
                                        color: node.degree === 0 ? '#FFFFFF' : '#1A1A1A',
                                        textAlign: 'center',
                                        lineHeight: 1.1,
                                        px: 0.3,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}>
                                        {node.label}
                                    </Typography>
                                    {isVisible && (
                                        <Chip
                                            label={`+${node.delta}%`}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: -8,
                                                right: -8,
                                                height: 18,
                                                fontSize: '0.55rem',
                                                fontWeight: 700,
                                                bgcolor: '#2D5A3D',
                                                color: '#FFFFFF',
                                                animation: 'fadeInUp 400ms ease both',
                                                animationDelay: `${node.degree * 400 + 200}ms`,
                                            }}
                                        />
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* Score + Continue */}
                <Box sx={{
                    opacity: phase >= 3 ? 1 : 0,
                    transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 500ms ease',
                }}>
                    <Typography sx={{ color: '#5C5C5C', fontSize: '0.85rem', mb: 2 }}>
                        Quiz Score: <strong style={{ color: '#2D5A3D' }}>{(score * 100).toFixed(0)}%</strong>
                        {' · '}{rippleNodes.filter(n => n.degree > 0).length} concepts boosted
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={onClose}
                        sx={{
                            bgcolor: '#2D5A3D',
                            fontWeight: 700,
                            px: 5,
                            py: 1.2,
                            borderRadius: 2,
                            fontSize: '0.9rem',
                            '&:hover': { bgcolor: '#1B4332' },
                        }}
                    >
                        Continue Learning
                    </Button>
                </Box>
            </Box>
        </Backdrop>
    );
};

export default MasteryRipple;
