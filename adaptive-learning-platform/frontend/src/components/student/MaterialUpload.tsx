import React, { useState, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { uploadMaterial } from '../../api';

interface MaterialUploadProps {
    studentId: string;
    onUploadComplete: () => void;
}

export const MaterialUpload: React.FC<MaterialUploadProps> = ({ studentId, onUploadComplete }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const allowedTypes = ['.pdf', '.docx', '.pptx', '.txt', '.md', '.png', '.jpg', '.jpeg'];

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        setError(null);
        const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

        if (!allowedTypes.includes(ext)) {
            setError(`Unsupported file type: ${ext}. Please upload a PDF, Word, PowerPoint, Text, or Image file.`);
            setFile(null);
            return;
        }

        setFile(selectedFile);
    };

    const onUploadClick = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            await uploadMaterial(studentId, file);
            setFile(null);
            onUploadComplete();
        } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.response?.data?.detail || "Failed to upload material. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            <Typography variant="h5" sx={{ fontFamily: 'Playfair Display, serif', mb: 2, color: 'text.primary' }}>
                Add Study Material
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                sx={{
                    border: '2px dashed',
                    borderColor: dragActive ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: dragActive ? 'rgba(46, 125, 50, 0.05)' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main',
                    }
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleChange}
                />

                {!file ? (
                    <>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.primary">
                            Drag & Drop your file here
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            or click to browse
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                            Supported: PDF, DOCX, PPTX, TXT, MD, Images (Notes)
                        </Typography>
                    </>
                ) : (
                    <>
                        <InsertDriveFileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" color="primary.main" noWrap>
                            {file.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                    </>
                )}
            </Box>

            {file && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setFile(null)}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onUploadClick}
                        disabled={uploading}
                        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                    >
                        {uploading ? 'Processing...' : 'Upload & Expand'}
                    </Button>
                </Box>
            )}
        </Box>
    );
};
