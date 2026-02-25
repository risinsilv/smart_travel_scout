import React, { useState } from 'react';
import { Box, TextField, IconButton, InputAdornment, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatInput = ({ onSendMessage, disabled, sx, showCaption = true, modelControl, cancelControl }) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim() && !disabled) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Box
            sx={{
                p: 2,
                pb: 4,
                width: '100%',
                maxWidth: '1000px',
                mx: 'auto',
                ...sx,
            }}
        >
            {/* controls directly inside the chat box */}
            {(modelControl || cancelControl) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {modelControl && <Box sx={{ flexShrink: 0 }}>{modelControl}</Box>}
                    <Box sx={{ flex: 1, minWidth: 0 }} />
                    {cancelControl && <Box sx={{ flexShrink: 0 }}>{cancelControl}</Box>}
                </Box>
            )}
            <TextField
                fullWidth
                multiline
                maxRows={8}
                placeholder="Send a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={disabled}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                        borderRadius: 3,
                        boxShadow: '0 0 20px rgba(0,0,0,0.2)',
                        px: 2,
                        py: 1,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                    }
                }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handleSend}
                                disabled={!input.trim() || disabled}
                                sx={{
                                    color: 'primary.main',
                                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                <SendIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            {showCaption && (
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        textAlign: 'center',
                        mt: 1.5,
                        color: 'text.secondary',
                        fontSize: 11
                    }}
                >
                    Travel Scout is an AI experiment. Verify matching details before booking.
                </Typography>
            )}
        </Box>
    );
};

export default ChatInput;
