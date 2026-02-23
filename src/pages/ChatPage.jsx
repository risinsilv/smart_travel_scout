import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import { Box, Typography, IconButton } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const ChatPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Welcome to Smart Travel Scout! I'm here to help you discover the perfect SRI Lankan experience from our exclusive inventory. What's on your mind today? (e.g., 'A surfing getaway under $100')",
        }
    ]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (text) => {
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // Simulated Logic
        setTimeout(() => {
            const assistantMsg = {
                role: 'assistant',
                content: `I've analyzed your request: "${text}". Here's the best match I found in our inventory:`,
                matches: text.toLowerCase().includes('beach') || text.toLowerCase().includes('surf') ? [
                    {
                        title: "Surf & Chill Retreat",
                        location: "Arugam Bay",
                        price: 80,
                        reason: "This matches your interest in surfing and beach vibes perfectly, and it's within a great budget range."
                    }
                ] : [
                    {
                        title: "High-Altitude Tea Trails",
                        location: "Nuwara Eliya",
                        price: 120,
                        reason: "Since you didn't specify a beach, this cold-weather nature retreat is our top recommendation for a unique experience."
                    }
                ]
            };
            setMessages(prev => [...prev, assistantMsg]);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            {/* <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', bgcolor: 'background.paper', justifyContent: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18, color: 'primary.main', letterSpacing: -0.5 }}>
                    Smart Travel Scout
                </Typography>
            </Box> */}

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

                {/* Input Area */}
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
