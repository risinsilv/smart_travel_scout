import React from 'react';
import { Box, Typography, Paper } from '@mui/material';


const ChatMessage = ({ message }) => {
    const isAssistant = message.role === 'assistant';

    return (
        <Box
            sx={{
                width: '100%',
                bgcolor: isAssistant ? 'background.default' : 'transparent',
                py: 3,
                display: 'flex',
                justifyContent: 'center'
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '1000px',
                    px: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end',
                    gap: 1
                }}
            >
                <Box
                    sx={{
                        width: isAssistant ? '100%' : 'fit-content',
                        maxWidth: '100%',
                        p: isAssistant ? 0 : 2.5,
                        borderRadius: isAssistant ? 0 : 3,
                        bgcolor: isAssistant ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
                        border: isAssistant ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: isAssistant ? 'left' : 'right'
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            color: isAssistant ? 'text.primary' : '#fff',
                            lineHeight: 1.8,
                            fontSize: '1rem',
                            whiteSpace: 'pre-wrap',
                            fontWeight: isAssistant ? 400 : 500
                        }}
                    >
                        {message.content}
                    </Typography>
                </Box>

                {isAssistant && message.matches && (
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
                        {message.matches.map((item, idx) => (
                            <Paper
                                key={idx}
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    bgcolor: 'background.paper',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                                }}
                            >
                                <Typography variant="h6" sx={{ fontSize: 16, color: 'primary.main', mb: 0.5 }}>
                                    {item.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                                    {item.location} • ${item.price}
                                </Typography>
                                <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Why this matches
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                                        {item.reason}
                                    </Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ChatMessage;
