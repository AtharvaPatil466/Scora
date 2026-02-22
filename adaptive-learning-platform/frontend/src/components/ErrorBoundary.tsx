import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 4, bgcolor: 'background.default' }}>
                    <Paper elevation={3} sx={{ p: 5, maxWidth: 600, textAlign: 'center', borderRadius: 2 }}>
                        <WarningAmberIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
                        <Typography variant="h4" color="error" gutterBottom>
                            Oops! Something went wrong.
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            The application encountered an unexpected error. This might be because the backend server is offline or not responding.
                        </Typography>
                        {this.state.error && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'left', overflowX: 'auto' }}>
                                <Typography variant="body2" color="error" sx={{ fontFamily: 'monospace' }}>
                                    {this.state.error.message}
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ mt: 4 }}
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
