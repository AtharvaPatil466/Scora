import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, IconButton, Paper, Fab, CircularProgress, Tooltip, Avatar, Switch, FormControlLabel, Chip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MicIcon from '@mui/icons-material/Mic';
import { TutorChatProps, ChatMessage } from '../../types/tutor';
import MenuBookIcon from '@mui/icons-material/MenuBook';

export const TutorChat: React.FC<TutorChatProps> = ({ studentId, currentConceptId, currentProblem, context }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [socraticMode, setSocraticMode] = useState(true);
    const conceptName = currentConceptId ? currentConceptId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;

    const getContextWelcome = () => {
        if (context === 'quiz' && currentProblem) {
            return `I can see you're working on a quiz about ${conceptName || 'a topic'}. I won't give away answers, but I can help you think through the problem. What's tripping you up?`;
        }
        if (context === 'content' && conceptName) {
            return `I see you're studying ${conceptName}. I can walk you through the key ideas, give practice problems, or answer specific questions. What would help?`;
        }
        return `Hi there! I'm your AI Tutor. How can I help you today?`;
    };

    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: 'msg_0',
        role: 'tutor',
        content: getContextWelcome(),
        timestamp: Date.now()
    }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'student',
            content: text,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            let response = "That's an interesting thought! What happens if we consider it from another perspective?";

            if (!socraticMode) {
                if (conceptName) {
                    response = `Here's a direct explanation for ${conceptName}: This concept involves understanding the fundamental relationships between quantities. The key insight is to identify the pattern and apply the relevant formula step by step.`;
                } else {
                    response = "Since 'Just tell me' mode is on: The key is to identify the pattern, apply the relevant formula, and verify your answer by substituting back.";
                }
            } else if (text.toLowerCase().includes('explain like i\'m 5')) {
                response = conceptName
                    ? `Let me explain ${conceptName} simply: Imagine you have a magic box that follows special rules. We're trying to figure out what number makes the magic box happy!`
                    : "Imagine you have a magic box that turns numbers into larger numbers based on a secret rule. We're trying to figure out what number we can put in to get exactly zero back!";
            } else if (text.toLowerCase().includes('hint')) {
                response = conceptName
                    ? `Here's a hint for ${conceptName}: Focus on the relationship between the parts. What changes when you modify one variable?`
                    : `Focus on the first part of the equation. What is 'a' in your current problem?`;
            } else if (text.toLowerCase().includes('prerequisite') || text.toLowerCase().includes('prereq')) {
                response = conceptName
                    ? `Before diving deeper into ${conceptName}, make sure you're solid on the foundational concepts. These are the building blocks that make this topic click.`
                    : "Check your Knowledge Map to see which concepts feed into this one.";
            } else if (text.toLowerCase().includes('practice') || text.toLowerCase().includes('problem')) {
                response = conceptName
                    ? `Here's a practice problem for ${conceptName}: Try solving this step by step, and tell me where you get stuck. I'll guide you through it!`
                    : "Let me generate a practice problem that matches your current level. What topic are you working on?";
            } else if (text.toLowerCase().includes('example')) {
                response = conceptName
                    ? `Let's work through an example of ${conceptName} together. I'll show you the first step: identify what you're solving for. Now, what do you think comes next?`
                    : `Sure, let's look at x² - 5x + 6 = 0. Here, a=1, b=-5, c=6. Can you try plugging those into the formula?`;
            } else if (context === 'quiz' && currentProblem) {
                response = `Instead of giving you the exact answer to "${currentProblem}", try to think about the inverse operation. What would that look like?`;
            } else if (conceptName) {
                response = `That's a great question about ${conceptName}! Think about how the pieces connect — what happens if you change one part? That's often the key insight.`;
            }

            const aiMsg: ChatMessage = {
                id: `msg_${Date.now() + 1}`,
                role: 'tutor',
                content: response,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getQuickActions = () => {
        const base = ["Explain like I'm 5", "Give me a hint"];
        if (conceptName) {
            return [`Explain ${conceptName}`, "Give me a practice problem", "Show prerequisites"];
        }
        return [...base, "Show me an example"];
    };
    const quickActions = getQuickActions();

    return (
        <>
            {/* Floating Orb Toggle */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 1000,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isOpen ? 'scale(0)' : isHovered ? 'scale(1.1)' : 'scale(1)',
                    opacity: isOpen ? 0 : 1,
                    pointerEvents: isOpen ? 'none' : 'auto',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Pulse ring */}
                <Box sx={{
                    position: 'absolute',
                    inset: -8,
                    borderRadius: '50%',
                    border: '2px solid rgba(45, 90, 61, 0.3)',
                    animation: 'ripple 2s ease-in-out infinite',
                }} />
                <Tooltip title="Need help? Ask your AI Tutor" placement="left">
                    <Fab
                        color="primary"
                        aria-label="chat"
                        onClick={() => setIsOpen(true)}
                        sx={{
                            width: 60, height: 60,
                            background: '#2D5A3D',
                            boxShadow: '0 0 24px rgba(45, 90, 61, 0.3), 0 8px 32px rgba(0, 0, 0, 0.15)',
                            '&:hover': {
                                background: '#1B4332',
                                boxShadow: '0 0 32px rgba(45, 90, 61, 0.4), 0 12px 40px rgba(0, 0, 0, 0.2)',
                            }
                        }}
                    >
                        <SmartToyIcon sx={{ fontSize: 28, color: 'white' }} />
                    </Fab>
                </Tooltip>
            </Box>

            {/* Chat Window */}
            <Paper
                elevation={0}
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    width: { xs: 'calc(100vw - 32px)', sm: 400 },
                    height: 580,
                    maxHeight: 'calc(100vh - 64px)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    overflow: 'hidden',
                    zIndex: 1001,
                    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                    transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.92)',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    bgcolor: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.12)',
                    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Header */}
                <Box sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, rgba(45, 90, 61, 0.08) 0%, #FFFFFF 100%)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{
                            width: 36, height: 36,
                            background: '#2D5A3D',
                            boxShadow: '0 0 8px rgba(45, 90, 61, 0.2)',
                        }}>
                            <SmartToyIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#1A1A1A', fontSize: '0.95rem' }}>Nova</Typography>
                            <Typography variant="caption" sx={{ color: '#2D5A3D', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2D5A3D', animation: 'pulse 2s infinite' }} /> Online
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                            control={<Switch size="small" checked={socraticMode} onChange={(e) => setSocraticMode(e.target.checked)} sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#2D5A3D' },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2D5A3D' },
                            }} />}
                            label={<Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#8C8C8C' }}>{socraticMode ? 'Guide me' : 'Just tell me'}</Typography>}
                            labelPlacement="start"
                            sx={{ m: 0 }}
                        />
                        <IconButton
                            size="small"
                            onClick={() => setIsOpen(false)}
                            sx={{
                                color: '#8C8C8C',
                                '&:hover': { color: '#1A1A1A', bgcolor: 'rgba(0,0,0,0.04)' },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Context banner */}
                {conceptName && context !== 'general' && (
                    <Box sx={{
                        px: 2, py: 1,
                        bgcolor: 'rgba(45, 90, 61, 0.04)',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                        <MenuBookIcon sx={{ fontSize: 14, color: '#2D5A3D' }} />
                        <Typography sx={{ fontSize: '0.68rem', color: '#2D5A3D', fontWeight: 600 }}>
                            {context === 'quiz' ? '📝 Quizzing' : '📖 Studying'}: {conceptName}
                        </Typography>
                    </Box>
                )}

                {/* Messages Area */}
                <Box sx={{
                    flexGrow: 1, p: 2.5, overflowY: 'auto',
                    bgcolor: '#F8F5F0',
                    display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                    {messages.map((msg) => {
                        const isStudent = msg.role === 'student';
                        return (
                            <Box
                                key={msg.id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: isStudent ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-end',
                                    gap: 1,
                                    animation: 'fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
                                }}
                            >
                                {!isStudent && (
                                    <Avatar sx={{
                                        width: 24, height: 24, mb: 0.5,
                                        background: '#2D5A3D',
                                    }}>
                                        <SmartToyIcon sx={{ fontSize: 14 }} />
                                    </Avatar>
                                )}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        px: 2,
                                        maxWidth: '78%',
                                        borderRadius: 3,
                                        bgcolor: isStudent
                                            ? '#2D5A3D'
                                            : '#FFFFFF',
                                        color: isStudent ? 'white' : '#1A1A1A',
                                        borderBottomRightRadius: isStudent ? 6 : 20,
                                        borderBottomLeftRadius: !isStudent ? 6 : 20,
                                        border: isStudent ? 'none' : '1px solid rgba(0,0,0,0.06)',
                                        boxShadow: isStudent ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ lineHeight: 1.6, wordBreak: 'break-word', fontSize: '0.85rem' }}>
                                        {msg.content}
                                    </Typography>
                                </Paper>
                            </Box>
                        );
                    })}

                    {isTyping && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, animation: 'fadeIn 300ms ease both' }}>
                            <Avatar sx={{ width: 24, height: 24, mb: 0.5, background: '#2D5A3D' }}>
                                <SmartToyIcon sx={{ fontSize: 14 }} />
                            </Avatar>
                            <Paper elevation={0} sx={{
                                p: 2, borderRadius: 3, borderBottomLeftRadius: 6,
                                bgcolor: '#FFFFFF',
                                border: '1px solid rgba(0,0,0,0.06)',
                            }}>
                                <Box sx={{ display: 'flex', gap: 0.6 }}>
                                    {[0, 1, 2].map(i => (
                                        <Box key={i} sx={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            bgcolor: '#2D5A3D',
                                            animation: `bounce 1.4s infinite ease-in-out both`,
                                            animationDelay: `${i * 0.16}s`,
                                        }} />
                                    ))}
                                </Box>
                            </Paper>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Quick Actions */}
                {messages[messages.length - 1].role === 'tutor' && !isTyping && (
                    <Box sx={{
                        p: 1.5, pb: 0.5,
                        bgcolor: '#FFFFFF',
                        display: 'flex', gap: 1,
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': { display: 'none' },
                    }}>
                        {quickActions.map((action, i) => (
                            <Chip
                                key={i}
                                label={action}
                                onClick={() => handleSend(action)}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(45, 90, 61, 0.06)',
                                    color: '#2D5A3D',
                                    border: '1px solid rgba(45, 90, 61, 0.15)',
                                    fontSize: '0.72rem',
                                    height: 28,
                                    transition: 'all 200ms ease',
                                    '&:hover': {
                                        bgcolor: 'rgba(45, 90, 61, 0.1)',
                                        borderColor: 'rgba(45, 90, 61, 0.3)',
                                        transform: 'translateY(-1px)',
                                    }
                                }}
                            />
                        ))}
                    </Box>
                )}

                {/* Input Area */}
                <Box sx={{
                    p: 1.5,
                    bgcolor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', gap: 1,
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Message Nova..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        maxRows={4}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: '#F8F5F0',
                                fontSize: '0.85rem',
                                '& fieldset': { borderColor: 'transparent' },
                                '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                                '&.Mui-focused fieldset': { borderColor: 'rgba(45, 90, 61, 0.4)', borderWidth: 1 }
                            }
                        }}
                    />
                    <IconButton sx={{
                        color: '#8C8C8C',
                        bgcolor: 'rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' }
                    }}>
                        <MicIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Fab
                        color="primary"
                        size="small"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        sx={{
                            boxShadow: 'none',
                            background: '#2D5A3D',
                            '&:hover': { background: '#1B4332' },
                            '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.25)' }
                        }}
                    >
                        <SendIcon fontSize="small" sx={{ ml: 0.3 }} />
                    </Fab>
                </Box>
            </Paper>

            <style>
                {`
                    @keyframes bounce {
                        0%, 80%, 100% { transform: scale(0); }
                        40% { transform: scale(1); }
                    }
                    @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes ripple {
                        0% { transform: scale(0.8); opacity: 1; }
                        100% { transform: scale(2.4); opacity: 0; }
                    }
                `}
            </style>
        </>
    );
};

export default TutorChat;
