import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import { Box, Typography } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { searchTravel } from '../services/scoutService';

const ChatPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Welcome to Smart Travel Scout! I'm here to help you discover the perfect Sri Lankan experience from our exclusive inventory. What's on your mind today? (e.g., 'A surfing getaway under $100')",
        }
    ]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text) => {
        // Append the user message immediately so the UI feels responsive
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const { matches, fallback_message } = await searchTravel(text);

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
            // Surface API / network errors gracefully rather than crashing
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Something went wrong while scouting the inventory. ${err.message || 'Please try again.'}`,
                }
            ]);
        } finally {
            setIsLoading(false);
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

                {/* Input Area — gradient fade so it sits on top of messages */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, #343541 30%)',
                    pt: 4,
                    pb: 2
                }}>
                    <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
                </Box>
            </Box>
        </Box>
    );
};

export default ChatPage;
