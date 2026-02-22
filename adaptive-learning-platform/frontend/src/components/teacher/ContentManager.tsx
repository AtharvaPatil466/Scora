import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, TextField, Select, MenuItem, InputLabel, FormControl, Chip, Stack, Switch, FormControlLabel, Paper, Slider } from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const kgConcepts = [
    'Basic Addition', 'Basic Subtraction', 'Early Multiplication',
    'Basic Division', 'Fractions', 'Decimals', 'Basic Equations',
    'Systems of Equations', 'Quadratic Formula'
];

export const ContentManager: React.FC = () => {
    const [contentType, setContentType] = useState('reading');
    const [concept, setConcept] = useState('Quadratic Formula');
    const [difficulty, setDifficulty] = useState(0.8);

    const contentBodyTemplate = `{generate_hero_image_prompt: "A balanced scale showing mathematical equality"}

The Quadratic Formula is used to find the roots of a quadratic equation.

Formula: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

{insert_adaptive_analogy_here}`;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }} className="animate-in">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#2D5A3D', fontWeight: 700, letterSpacing: 2, fontSize: '0.65rem' }}>
                        INSTRUCTOR
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700, color: '#1A1A1A', fontFamily: '"Playfair Display", serif' }}>
                        Content Manager
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" startIcon={<UploadFileIcon />} sx={{
                        borderColor: 'rgba(0,0,0,0.12)', color: '#5C5C5C',
                        '&:hover': { borderColor: 'rgba(0,0,0,0.2)' },
                    }}>
                        Bulk Import
                    </Button>
                    <Button variant="contained" startIcon={<SmartToyIcon />} sx={{
                        background: '#2D5A3D',
                        '&:hover': { background: '#1B4332' },
                    }}>
                        AI Generate
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={4}>
                {/* Editor Form */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card elevation={0} sx={{ bgcolor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontFamily: '"Playfair Display", serif', color: '#1A1A1A' }}>Create New Lesson Material</Typography>

                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="Lesson Title"
                                        defaultValue="Introduction to the Quadratic Formula"
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Content Type</InputLabel>
                                        <Select value={contentType} onChange={(e) => setContentType(e.target.value as string)} label="Content Type">
                                            <MenuItem value="reading">Reading (Text/Markdown)</MenuItem>
                                            <MenuItem value="video">Video (MP4/HLS)</MenuItem>
                                            <MenuItem value="interactive">Interactive Simulation</MenuItem>
                                            <MenuItem value="quiz">Assessment / Quiz</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Target Concept</InputLabel>
                                        <Select value={concept} onChange={(e) => setConcept(e.target.value as string)} label="Target Concept">
                                            {kgConcepts.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid size={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#5C5C5C' }}>
                                            Difficulty Calibration
                                        </Typography>
                                        <Chip
                                            label={difficulty > 0.7 ? 'Advanced' : difficulty > 0.4 ? 'Intermediate' : 'Foundation'}
                                            size="small"
                                            sx={{
                                                bgcolor: difficulty > 0.7
                                                    ? 'rgba(220, 38, 38, 0.06)' : difficulty > 0.4
                                                        ? 'rgba(217, 119, 6, 0.06)' : 'rgba(45, 90, 61, 0.06)',
                                                color: difficulty > 0.7 ? '#DC2626' : difficulty > 0.4 ? '#D97706' : '#2D5A3D',
                                                fontWeight: 700,
                                                fontSize: '0.65rem',
                                                height: 22,
                                            }}
                                        />
                                    </Box>
                                    <Slider
                                        value={difficulty}
                                        onChange={(_, v) => setDifficulty(v as number)}
                                        min={0} max={1} step={0.1}
                                        sx={{
                                            color: 'primary.main',
                                            '& .MuiSlider-track': {
                                                background: 'linear-gradient(90deg, #2D5A3D, #D97706, #DC2626)',
                                                border: 'none',
                                            },
                                            '& .MuiSlider-rail': {
                                                bgcolor: 'rgba(0,0,0,0.08)',
                                            },
                                            '& .MuiSlider-thumb': {
                                                bgcolor: 'white',
                                                border: '2px solid',
                                                borderColor: 'primary.main',
                                                '&:hover': { boxShadow: '0 0 10px rgba(45, 90, 61, 0.25)' },
                                            }
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" sx={{ color: '#8C8C8C' }}>Foundation (0.0)</Typography>
                                        <Typography variant="caption" sx={{ color: '#8C8C8C' }}>Advanced (1.0)</Typography>
                                    </Box>
                                </Grid>

                                {/* Code/Content Editor */}
                                <Grid size={12}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#5C5C5C' }}>Content Body / Script Template</Typography>
                                    <Box sx={{
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        borderRadius: 2, minHeight: 200, p: 2.5,
                                        bgcolor: '#F8F5F0',
                                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                    }}>
                                        <Typography
                                            sx={{
                                                fontFamily: 'inherit',
                                                whiteSpace: 'pre-wrap',
                                                color: '#5C5C5C',
                                                fontSize: '0.85rem',
                                                lineHeight: 1.8,
                                            }}
                                        >
                                            {contentBodyTemplate}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* AI Generation Features */}
                                <Grid size={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <SmartToyIcon sx={{ color: '#2D5A3D', fontSize: 20 }} />
                                        <Typography variant="subtitle2" sx={{ color: '#2D5A3D', fontWeight: 700 }}>
                                            AI Generation Features
                                        </Typography>
                                    </Box>
                                    <Paper variant="outlined" sx={{
                                        p: 2.5, borderRadius: 3,
                                        bgcolor: 'rgba(45, 90, 61, 0.02)',
                                        borderColor: 'rgba(45, 90, 61, 0.12)',
                                    }}>
                                        {[
                                            { label: 'Enable A/B Variant Generation', desc: 'AWS Bedrock creates 3 variations for Visual, Verbal, and Analytical learners.', defaultChecked: true },
                                            { label: 'Generate Audio (Text-to-Speech)', desc: 'Synthesize podcast-style audio walkthrough of this content.', defaultChecked: false },
                                            { label: 'Extract Key Images (DALL-E / Titan)', desc: 'Auto-generate visual aids for {generate_hero_image_prompt} tags.', defaultChecked: false },
                                        ].map((feature, i) => (
                                            <Box key={i} sx={{ mb: i < 2 ? 2 : 0 }}>
                                                <FormControlLabel
                                                    control={<Switch defaultChecked={feature.defaultChecked} color="primary" size="small" />}
                                                    label={<Typography variant="body2" fontWeight="bold" sx={{ color: '#1A1A1A' }}>{feature.label}</Typography>}
                                                />
                                                <Typography variant="caption" sx={{ color: '#8C8C8C', display: 'block', ml: 5.5 }}>
                                                    {feature.desc}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Paper>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button variant="text" sx={{ color: '#8C8C8C' }}>Cancel</Button>
                                <Button variant="contained" sx={{
                                    background: '#2D5A3D',
                                    '&:hover': { background: '#1B4332' },
                                }}>
                                    Publish to Library
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ mb: 3, bgcolor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontFamily: '"Playfair Display", serif', color: '#1A1A1A' }}>Knowledge Graph Hooks</Typography>
                            <Typography variant="body2" sx={{ color: '#8C8C8C', mb: 2 }}>
                                Define the requirements to unlock this content.
                            </Typography>

                            <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.6rem', color: '#1A1A1A', display: 'block', mb: 1 }}>
                                Prerequisites
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                                <Chip label="Basic Equations (≥ 0.8)" onDelete={() => { }} size="small" sx={{
                                    bgcolor: 'rgba(45, 90, 61, 0.06)', color: '#2D5A3D',
                                    border: '1px solid rgba(45, 90, 61, 0.15)', fontSize: '0.7rem',
                                }} />
                                <Chip label="Exponents (≥ 0.6)" onDelete={() => { }} size="small" sx={{
                                    bgcolor: 'rgba(45, 90, 61, 0.06)', color: '#2D5A3D',
                                    border: '1px solid rgba(45, 90, 61, 0.15)', fontSize: '0.7rem',
                                }} />
                                <Button size="small" startIcon={<AddIcon />} sx={{ color: '#2D5A3D', fontSize: '0.7rem', fontWeight: 600 }}>Add</Button>
                            </Stack>

                            <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.6rem', color: '#1A1A1A', display: 'block', mb: 1 }}>
                                Tags
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {['#algebra', '#roots', '#formulas'].map(tag => (
                                    <Chip key={tag} label={tag} size="small" sx={{
                                        bgcolor: 'rgba(0,0,0,0.03)', color: '#5C5C5C', fontSize: '0.7rem',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                    }} />
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card elevation={0} sx={{
                        bgcolor: 'rgba(45, 90, 61, 0.03)',
                        border: '1px solid rgba(45, 90, 61, 0.12)',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <SmartToyIcon sx={{ color: '#2D5A3D', fontSize: 20 }} />
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#2D5A3D' }}>AI Quality Assurance</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#8C8C8C', mb: 2 }}>
                                Running preliminary checks on this content draft...
                            </Typography>
                            <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#2D5A3D', fontSize: 16 }} />
                                    <Typography variant="caption" sx={{ color: '#2D5A3D' }}>Flesch-Kincaid Reading Ease matches difficulty</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#2D5A3D', fontSize: 16 }} />
                                    <Typography variant="caption" sx={{ color: '#2D5A3D' }}>MathJax syntax is valid</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ErrorOutlineIcon sx={{ color: '#D97706', fontSize: 16 }} />
                                    <Typography variant="caption" sx={{ color: '#D97706' }}>Missing Alt-text for requested hero image</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ContentManager;
