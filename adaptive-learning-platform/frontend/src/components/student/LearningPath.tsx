import React from 'react';
import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { KnowledgeGraphData, Node, Edge } from '../../types';

interface LearningPathProps {
    kgData: KnowledgeGraphData;
}

interface PathStep {
    node: Node;
    status: 'completed' | 'current' | 'upcoming' | 'locked';
    prerequisitesMastered: number;
    totalPrerequisites: number;
}

// Compute a learning path via topological sort of unmastered nodes
const computeLearningPath = (kgData: KnowledgeGraphData): PathStep[] => {
    const { nodes, edges } = kgData;

    // Build adjacency: parent → children (source is prereq of target)
    const childrenOf: Record<number, number[]> = {};
    const parentsOf: Record<number, number[]> = {};
    nodes.forEach(n => { childrenOf[n.id] = []; parentsOf[n.id] = []; });
    edges.forEach(e => {
        const src = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const tgt = typeof e.target === 'object' ? (e.target as any).id : e.target;
        if (childrenOf[src]) childrenOf[src].push(tgt);
        if (parentsOf[tgt]) parentsOf[tgt].push(src);
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Compute depth via BFS from roots (nodes with no parents)
    const depth: Record<number, number> = {};
    const roots = nodes.filter(n => parentsOf[n.id].length === 0);
    const queue: { id: number; d: number }[] = roots.map(n => ({ id: n.id, d: 0 }));
    const visited = new Set<number>();

    while (queue.length > 0) {
        const { id, d } = queue.shift()!;
        if (visited.has(id)) {
            depth[id] = Math.max(depth[id] || 0, d);
            continue;
        }
        visited.add(id);
        depth[id] = d;
        for (const child of childrenOf[id]) {
            queue.push({ id: child, d: d + 1 });
        }
    }

    // Any unvisited nodes get max depth
    nodes.forEach(n => { if (!(n.id in depth)) depth[n.id] = 999; });

    // Sort by depth, then by mastery descending (higher mastery = closer to done)
    const sorted = [...nodes].sort((a, b) => {
        if (depth[a.id] !== depth[b.id]) return depth[a.id] - depth[b.id];
        return b.mastery - a.mastery;
    });

    // Build path: completed first, then current, then upcoming
    const steps: PathStep[] = sorted.map(node => {
        const parents = parentsOf[node.id] || [];
        const masteredParents = parents.filter(pid => {
            const p = nodeMap.get(pid);
            return p && p.mastery >= 0.7;
        }).length;

        let status: PathStep['status'];
        if (node.mastery >= 0.7) {
            status = 'completed';
        } else if (parents.length === 0 || masteredParents >= parents.length * 0.5) {
            status = 'upcoming'; // prerequisites are partially met
        } else {
            status = 'locked';
        }

        return {
            node,
            status,
            prerequisitesMastered: masteredParents,
            totalPrerequisites: parents.length,
        };
    });

    // Mark first 'upcoming' as 'current'
    const firstUpcoming = steps.findIndex(s => s.status === 'upcoming');
    if (firstUpcoming !== -1) {
        steps[firstUpcoming].status = 'current';
    }

    // Show: up to 3 completed (most recent) + current + up to 6 upcoming/locked
    const completed = steps.filter(s => s.status === 'completed');
    const rest = steps.filter(s => s.status !== 'completed');

    const recentCompleted = completed.slice(-3);
    const upcomingSteps = rest.slice(0, 7);

    return [...recentCompleted, ...upcomingSteps];
};

const LearningPath: React.FC<LearningPathProps> = ({ kgData }) => {
    const steps = computeLearningPath(kgData);

    if (steps.length === 0) return null;

    const getStatusIcon = (status: PathStep['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon sx={{ fontSize: 22, color: '#2D5A3D' }} />;
            case 'current':
                return <RadioButtonCheckedIcon sx={{ fontSize: 22, color: '#2D5A3D', animation: 'pulse 2s ease-in-out infinite' }} />;
            case 'upcoming':
                return <RadioButtonUncheckedIcon sx={{ fontSize: 22, color: '#8C8C8C' }} />;
            case 'locked':
                return <LockOutlinedIcon sx={{ fontSize: 18, color: '#BFBFBF' }} />;
        }
    };

    const getStatusColor = (status: PathStep['status']) => {
        switch (status) {
            case 'completed': return '#2D5A3D';
            case 'current': return '#2D5A3D';
            case 'upcoming': return '#5C5C5C';
            case 'locked': return '#BFBFBF';
        }
    };

    const getStatusLabel = (step: PathStep) => {
        if (step.status === 'completed') return 'Mastered';
        if (step.status === 'current') return 'Up next';
        if (step.status === 'locked') return `${step.prerequisitesMastered}/${step.totalPrerequisites} prereqs`;
        return `${(step.node.mastery * 100).toFixed(0)}% mastery`;
    };

    return (
        <Box sx={{ position: 'relative' }}>
            {steps.map((step, index) => (
                <Box
                    key={step.node.id}
                    sx={{
                        display: 'flex',
                        gap: 2,
                        position: 'relative',
                        opacity: step.status === 'locked' ? 0.5 : 1,
                        mb: index < steps.length - 1 ? 0 : 0,
                    }}
                >
                    {/* Timeline line + icon */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
                        {getStatusIcon(step.status)}
                        {index < steps.length - 1 && (
                            <Box sx={{
                                width: 2,
                                flexGrow: 1,
                                minHeight: 32,
                                bgcolor: step.status === 'completed' ? '#2D5A3D' : 'rgba(0,0,0,0.08)',
                                transition: 'background-color 500ms',
                            }} />
                        )}
                    </Box>

                    {/* Content */}
                    <Box sx={{
                        flex: 1,
                        pb: 2.5,
                        pt: 0.2,
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography sx={{
                                fontSize: '0.85rem',
                                fontWeight: step.status === 'current' ? 700 : 600,
                                color: getStatusColor(step.status),
                                fontFamily: step.status === 'current' ? '"Playfair Display", serif' : 'inherit',
                            }}>
                                {step.node.label}
                            </Typography>
                            <Chip
                                label={getStatusLabel(step)}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.58rem',
                                    fontWeight: 600,
                                    bgcolor: step.status === 'completed'
                                        ? 'rgba(45, 90, 61, 0.08)'
                                        : step.status === 'current'
                                            ? 'rgba(45, 90, 61, 0.1)'
                                            : 'rgba(0,0,0,0.04)',
                                    color: step.status === 'completed' || step.status === 'current'
                                        ? '#2D5A3D'
                                        : '#8C8C8C',
                                    border: step.status === 'current' ? '1px solid rgba(45,90,61,0.2)' : 'none',
                                }}
                            />
                        </Box>

                        {/* Progress bar for non-completed/non-locked */}
                        {step.status !== 'completed' && step.status !== 'locked' && (
                            <LinearProgress
                                variant="determinate"
                                value={step.node.mastery * 100}
                                sx={{
                                    height: 3,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(0,0,0,0.04)',
                                    mt: 0.5,
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 2,
                                        background: 'linear-gradient(90deg, #2D5A3D, #4A8C62)',
                                    }
                                }}
                            />
                        )}

                        {/* Current step highlight */}
                        {step.status === 'current' && (
                            <Typography sx={{ fontSize: '0.68rem', color: '#2D5A3D', mt: 0.5, fontWeight: 500 }}>
                                ← You are here · ~15 min to master
                            </Typography>
                        )}
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default LearningPath;
