import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { searchTravel } from '../services/scoutService';

const ChatPage = () => {
    // --- model selector state ------------------------------------------------
    // load model options from environment variables prefixed with VITE_MODEL_
    const rawEnv = import.meta.env;
    const availableModels = Object.entries(rawEnv)
        .filter(([key]) => key.startsWith('VITE_MODEL_'))
        .map(([, value]) => {
            // allow syntax provider:modelName (e.g. openrouter:openai/gpt-5.2)
            const str = String(value);
            const [provider, name] = str.includes(':') ? str.split(':', 2) : ['gemini', str];
            const label =
                provider === 'openrouter'
                    ? `OpenRouter – ${name}`
                    : `Gemini – ${name}`;
            return { provider, name, label };
        });

    const [selectedModel, setSelectedModel] = useState(
        availableModels.length > 0 ? availableModels[0] : null
    );

    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Welcome to Smart Travel Scout! I'm here to help you discover the perfect Sri Lankan experience from our exclusive inventory. What's on your mind today? (e.g., 'A surfing getaway under $100')",
        }
    ]);
    const messagesEndRef = useRef(null);

    // abort controller for current in-flight request
    const abortController = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // make sure we abort any pending request when component unmounts
    useEffect(() => {
        return () => {
            abortController.current?.abort();
        };
    }, []);

    const handleSendMessage = async (text) => {
        // abort any partially completed request (shouldn't happen, but safe)
        if (abortController.current) {
            abortController.current.abort();
        }
        abortController.current = new AbortController();

        // Append the user message immediately so the UI feels responsive
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const opts = {
                signal: abortController.current.signal,
            };
            if (selectedModel) {
                opts.model = selectedModel.name;
                opts.provider = selectedModel.provider;
            }

            const { matches, fallback_message } = await searchTravel(text, opts);

            let content = '';
            let msgMatches = [];

            if (matches && matches.length > 0) {
                // Matches found — build a natural intro line
                content = `I found ${matches.length} experience${matches.length > 1 ? 's' : ''} from our inventory that match your request:`;
                msgMatches = matches;
            } else {
                // No matches — show the fallback guidance from the AI
                content = fallback_message || "I couldn't find anything in our inventory that matches your request. Try describing your ideal vibe, budget, or activity!";
            }

            setMessages(prev => [...prev, { role: 'assistant', content, matches: msgMatches }]);
        } catch (err) {
            // if the request was aborted, we simply stop loading and don't add an error
            if (err.name === 'AbortError') {
                setMessages(prev => [
                    ...prev,
                    { role: 'assistant', content: 'Request cancelled.' }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `Something went wrong while scouting the inventory. ${err.message || 'Please try again.'}`,
                    }
                ]);
            }
        } finally {
            setIsLoading(false);
            abortController.current = null;
        }
    };

    const handleCancel = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', bgcolor: 'background.default' }}>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                {/* Message Area */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} message={msg} />
                    ))}
                    {isLoading && (
                        <Box sx={{ px: 2, py: 4, display: 'flex', justifyContent: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                Scouting the inventory...
                            </Typography>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                    <Box sx={{ minHeight: '150px' }} />
                </Box>

                {/* Input area with controls inside the chat box */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, #343541 30%)',
                    pt: 4,
                    pb: 2
                }}>
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        disabled={isLoading}
                        sx={{ p: 0.5, pb: 0.5 }}
                        modelControl={
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel id="model-select-label">Model</InputLabel>
                                <Select
                                    labelId="model-select-label"
                                    value={selectedModel ? selectedModel.name : ''}
                                    label="Model"
                                    onChange={(e) => {
                                        const sel = availableModels.find(m => m.name === e.target.value);
                                        setSelectedModel(sel || null);
                                    }}
                                    disabled={isLoading}
                                >
                                    {availableModels.map((m) => (
                                        <MenuItem key={m.name} value={m.name}>
                                            {m.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        }
                        cancelControl={
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleCancel}
                                disabled={!isLoading}
                                sx={{ height: 'fit-content' }}
                            >
                                Cancel
                            </Button>
                        }
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default ChatPage;
