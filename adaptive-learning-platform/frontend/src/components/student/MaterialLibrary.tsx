import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, CardActionArea,
    Chip, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { Material } from '../../types/material';
import { getMaterials, deleteMaterial } from '../../api';

interface MaterialLibraryProps {
    studentId: string;
    onSelectMaterial: (material: Material) => void;
    refreshTrigger: number;
}

export const MaterialLibrary: React.FC<MaterialLibraryProps> = ({
    studentId,
    onSelectMaterial,
    refreshTrigger
}) => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMaterials = async () => {
        try {
            const data = await getMaterials(studentId);
            setMaterials(data);
        } catch (err) {
            console.error("Failed to fetch materials:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();

        // Poll for updates if any material is still processing
        const hasProcessing = materials.some(m => ['uploaded', 'extracting', 'expanding'].includes(m.status));
        let interval: NodeJS.Timeout;

        if (hasProcessing) {
            interval = setInterval(fetchMaterials, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [studentId, refreshTrigger, materials.length]);

    const handleDelete = async (e: React.MouseEvent, materialId: string) => {
        e.stopPropagation();
        try {
            await deleteMaterial(studentId, materialId);
            fetchMaterials();
        } catch (err) {
            console.error("Failed to delete material:", err);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <PictureAsPdfIcon color="error" />;
        if (type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return <ImageIcon color="info" />;
        return <DescriptionIcon color="primary" />;
    };

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'ready':
                return <Chip size="small" label="Ready to Study" color="success" />;
            case 'error':
                return <Chip size="small" label="Processing Failed" color="error" />;
            default:
                // Processing stages
                return (
                    <Chip
                        size="small"
                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                        color="warning"
                        icon={<CircularProgress size={16} sx={{ ml: 1 }} />}
                    />
                );
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    if (materials.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 6, backgroundColor: 'background.paper', borderRadius: 2 }}>
                <LibraryBooksIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Your Library is Empty</Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload notes, PDFs, or textbook photos to let Scora build your personalized lessons.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h5" sx={{ fontFamily: 'Playfair Display, serif', mb: 3, color: 'text.primary' }}>
                My Library
            </Typography>

            <Grid container spacing={3}>
                {materials.map((material) => (
                    <Grid item xs={12} sm={6} md={4} key={material.material_id}>
                        <Card
                            variant="outlined"
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.2s',
                                opacity: material.status === 'error' ? 0.7 : 1,
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: 2,
                                }
                            }}
                        >
                            <CardActionArea
                                onClick={() => material.status === 'ready' && onSelectMaterial(material)}
                                disabled={material.status !== 'ready'}
                                sx={{ flexGrow: 1, p: 2 }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {getFileIcon(material.file_type)}
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(material.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Tooltip title="Delete">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleDelete(e, material.material_id)}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 1 }} noWrap>
                                    {material.title || material.filename}
                                </Typography>

                                {material.summary && (
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        mb: 2,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {material.summary}
                                    </Typography>
                                )}

                                <Box sx={{ mt: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {getStatusChip(material.status)}
                                    {material.num_chapters > 0 && (
                                        <Chip size="small" variant="outlined" label={`${material.num_chapters} Sections`} />
                                    )}
                                    {material.num_questions > 0 && (
                                        <Chip size="small" variant="outlined" label={`${material.num_questions} Questions`} />
                                    )}
                                </Box>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
