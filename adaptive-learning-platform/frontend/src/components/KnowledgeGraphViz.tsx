import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import * as d3 from 'd3';
import { Box, Typography, Paper, CircularProgress, Chip } from '@mui/material';
import { KnowledgeGraphData } from '../types';
import * as api from '../api';

const KnowledgeGraphViz: React.FC = () => {
    const d3Container = useRef<SVGSVGElement | null>(null);
    const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { student } = useSelector((state: RootState) => state.app);

    useEffect(() => {
        const fetchKG = async () => {
            setLoading(true);
            try {
                const data = await api.getKnowledgeGraph(student?.id);
                setGraphData(data);
            } catch (err) {
                console.error("Failed to load Knowledge Graph", err);
            } finally {
                setLoading(false);
            }
        };
        fetchKG();
    }, [student?.id]);

    useEffect(() => {
        if (!loading && graphData && d3Container.current) {
            const svg = d3.select(d3Container.current);
            svg.selectAll('*').remove();

            const width = d3Container.current.clientWidth || 800;
            const height = d3Container.current.clientHeight || 500;

            svg.attr('viewBox', [0, 0, width, height]);

            const nodes = graphData.nodes.map(d => Object.create(d));
            const links = graphData.edges.map(d => Object.create(d));

            const simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
                .force('charge', d3.forceManyBody().strength(-200))
                .force('center', d3.forceCenter(width / 2, height / 2));

            const innerGroup = svg.append('g');

            const zoom = d3.zoom()
                .scaleExtent([0.1, 4])
                .on('zoom', (event) => {
                    innerGroup.attr('transform', event.transform);
                });

            svg.call(zoom as any);
            svg.call(zoom.transform as any, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.6).translate(-width / 2, -height / 2));

            // Glow filter
            const defs = svg.append('defs');
            const filter = defs.append('filter')
                .attr('id', 'node-glow')
                .attr('x', '-50%')
                .attr('y', '-50%')
                .attr('width', '200%')
                .attr('height', '200%');
            filter.append('feGaussianBlur')
                .attr('stdDeviation', '4')
                .attr('result', 'coloredBlur');
            const feMerge = filter.append('feMerge');
            feMerge.append('feMergeNode').attr('in', 'coloredBlur');
            feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            const link = innerGroup.append('g')
                .selectAll('line')
                .data(links)
                .join('line')
                .attr('stroke', 'rgba(45, 90, 61, 0.25)')
                .attr('stroke-width', d => Math.sqrt((d as any).strength) * 2);

            const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]);

            const dragBehavior = (sim: d3.Simulation<d3.SimulationNodeDatum, undefined>) => {
                const dragstarted = (event: any) => {
                    if (!event.active) sim.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                };
                const dragged = (event: any) => {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                };
                const dragended = (event: any) => {
                    if (!event.active) sim.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                };
                return d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended);
            };

            const nodeGroup = innerGroup.append('g')
                .selectAll('g')
                .data(nodes)
                .join('g')
                .call(dragBehavior(simulation) as any);

            // Glow ring for mastered nodes
            nodeGroup.append('circle')
                .attr('r', 24)
                .attr('fill', 'none')
                .attr('stroke', (d: any) => d.mastery > 0.7 ? colorScale(d.mastery) : 'transparent')
                .attr('stroke-width', 2)
                .attr('opacity', 0.4)
                .attr('filter', 'url(#node-glow)');

            nodeGroup.append('circle')
                .attr('r', 18)
                .attr('fill', (d: any) => colorScale(d.mastery))
                .attr('stroke', 'rgba(0,0,0,0.15)')
                .attr('stroke-width', 1.5)
                .attr('filter', (d: any) => d.mastery > 0.7 ? 'url(#node-glow)' : 'none');

            nodeGroup.append('text')
                .attr('dy', 32)
                .attr('text-anchor', 'middle')
                .text((d: any) => d.label)
                .attr('font-size', '11px')
                .attr('fill', '#5C5C5C')
                .attr('font-family', 'Inter, sans-serif');

            nodeGroup.append('title')
                .text((d: any) => `${d.label}\nMastery: ${(d.mastery * 100).toFixed(1)}%`);

            simulation.on('tick', () => {
                link
                    .attr('x1', (d: any) => d.source.x)
                    .attr('y1', (d: any) => d.source.y)
                    .attr('x2', (d: any) => d.target.x)
                    .attr('y2', (d: any) => d.target.y);

                nodeGroup
                    .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
            });
        }
    }, [graphData]);

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }} className="animate-in">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, fontSize: '0.65rem' }}>
                        VISUALIZATION
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                        Knowledge Graph
                    </Typography>
                </Box>
                {/* Legend */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
                        <Typography variant="caption" sx={{ color: '#8C8C8C', fontSize: '0.65rem' }}>Low</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#eab308' }} />
                        <Typography variant="caption" sx={{ color: '#8C8C8C', fontSize: '0.65rem' }}>Mid</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e' }} />
                        <Typography variant="caption" sx={{ color: '#8C8C8C', fontSize: '0.65rem' }}>High</Typography>
                    </Box>
                </Box>
            </Box>
            <Paper
                elevation={0}
                sx={{
                    flexGrow: 1, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 2, borderRadius: 3,
                    bgcolor: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.08)',
                }}
            >
                {loading || !graphData ? (
                    <CircularProgress sx={{ color: '#2D5A3D' }} />
                ) : (
                    <svg
                        className="d3-component"
                        width="100%"
                        height="100%"
                        ref={d3Container}
                        style={{ background: '#F8F5F0', display: 'block' }}
                    />
                )}
            </Paper>
        </Box>
    );
};

export default KnowledgeGraphViz;
