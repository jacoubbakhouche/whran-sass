import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FiMessageSquare, FiSend, FiX, FiUser, FiCpu } from 'react-icons/fi';
import './AIChat.css';

export default function AIChat() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            if (!profile && user) {
                fetchProfile();
            }
        }
    }, [messages, isOpen]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (data) setProfile(data);
        } catch (err) {
            console.error('Error fetching profile for AI context:', err);
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const systemPrompt = `You are a helpful educational assistant for the "Edu-expert" platform in Algeria. 
            The user is currently logged in. 
            User Profile: ${profile ? JSON.stringify(profile) : 'Anonymous'}.
            Always respond in Arabic unless asked otherwise. Be professional, encouraging, and informative.`;

            const { data, error } = await supabase.functions.invoke('ai-chat', {
                body: {
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages,
                        userMessage
                    ]
                }
            });

            if (error) throw error;

            const aiMessage = { 
                role: 'assistant', 
                content: data.choices[0].message.content 
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI Chat Error:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى لاحقاً.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`ai-chat-container ${isOpen ? 'open' : ''}`}>
            {/* Floating Button */}
            <button 
                className="ai-chat-fab" 
                onClick={() => setIsOpen(!isOpen)}
                title="المساعد الذكي"
            >
                {isOpen ? <FiX size={24} /> : <FiCpu size={24} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chat-window animate-up">
                    <div className="ai-chat-header">
                        <div className="ai-chat-header__info">
                            <FiCpu className="ai-icon" />
                            <div>
                                <h3>المساعد الذكي</h3>
                                <span>مدعوم من Grok</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)}><FiX /></button>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-bubble ${msg.role}`}>
                                <div className="bubble-icon">
                                    {msg.role === 'assistant' ? <FiCpu /> : <FiUser />}
                                </div>
                                <div className="bubble-content">
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-bubble assistant loading">
                                <div className="bubble-icon"><FiCpu /></div>
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="ai-chat-input" onSubmit={handleSend}>
                        <input 
                            placeholder="اسألني أي شيء..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>
                            <FiSend />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
