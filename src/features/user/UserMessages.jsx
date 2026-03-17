import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { FiSend, FiArrowRight, FiMessageSquare, FiInfo } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import './UserMessages.css';

export default function UserMessages() {
    const { locale, dir } = useI18n();
    const navigate = useNavigate();
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [allMessages, setAllMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            setCurrentUserId(user.id);

            try {
                // Security Fix: Fetch root messages where user is the sender
                const { data: rootMessages, error: rootError } = await supabase
                    .from('institution_messages')
                    .select(`
                        *,
                        institutions (
                            id,
                            owner_id,
                            name_ar,
                            name_fr,
                            logo_url
                        )
                    `)
                    .eq('sender_id', user.id)
                    .is('reply_to', null)
                    .order('created_at', { ascending: false });

                if (rootError) throw rootError;

                if (!rootMessages || rootMessages.length === 0) {
                    setThreads([]);
                    setLoading(false);
                    return;
                }

                const rootIds = rootMessages.map(m => m.id);

                // Fetch all replies related to these root messages
                const { data: replies, error: replyError } = await supabase
                    .from('institution_messages')
                    .select('*')
                    .in('reply_to', rootIds)
                    .order('created_at', { ascending: true });

                if (replyError) throw replyError;

                // combine into threads
                const threadList = rootMessages.map(root => {
                    const threadReplies = replies.filter(r => r.reply_to === root.id);
                    const lastMsg = threadReplies.length > 0 ? threadReplies[threadReplies.length - 1] : root;
                    return {
                        ...root,
                        replies: threadReplies,
                        last_message: lastMsg,
                        institution: root.institutions,
                        // Ensure we always know who we are talking to
                        display_name: getInstitutionName(root.institutions)
                    };
                }).sort((a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at));

                setThreads(threadList);
                setAllMessages([...rootMessages, ...replies]);
            } catch (err) {
                console.error('Error fetching user messages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedThread) return;
        setSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('institution_messages')
                .insert([{
                    institution_id: selectedThread.institution_id,
                    sender_id: user.id,
                    recipient_id: selectedThread.institution?.owner_id,
                    sender_name: user.user_metadata?.full_name || user.email,
                    sender_avatar: user.user_metadata?.avatar_url,
                    subject: `Re: ${selectedThread.subject}`,
                    content: replyText,
                    reply_to: selectedThread.id
                }])
                .select();

            if (error) throw error;
            if (data) {
                const newReply = data[0];
                setSelectedThread(prev => ({
                    ...prev,
                    replies: [...prev.replies, newReply],
                    last_message: newReply
                }));
                setThreads(prev => prev.map(t => 
                    t.id === selectedThread.id 
                    ? { ...t, replies: [...t.replies, newReply], last_message: newReply } 
                    : t
                ).sort((a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at)));
                setReplyText('');
            }
        } catch (err) {
            console.error('Reply error:', err);
        } finally {
            setSending(false);
        }
    };

    const getInstitutionName = (inst) => {
        if (!inst) return locale === 'ar' ? 'مؤسسة' : 'Institution';
        return locale === 'ar' ? (inst.name_ar || inst.name_fr) : (inst.name_fr || inst.name_ar);
    };

    if (loading) {
        return (
            <div className="user-messages-page">
                <Skeleton width="200px" height="32px" style={{ marginBottom: '2rem' }} />
                {[1, 2, 3].map(i => (
                    <div key={i} className="chat-card" style={{ marginBottom: '12px' }}>
                        <Skeleton variant="circle" width="56px" height="56px" />
                        <div style={{ flex: 1 }}>
                            <Skeleton width="120px" height="18px" style={{ marginBottom: '8px' }} />
                            <Skeleton width="80%" height="14px" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="user-messages-page animate-up" dir={dir}>
            <header className="user-messages-header">
                <button className="back-btn" onClick={() => navigate('/profile')}>
                    <FiArrowRight style={{ transform: locale === 'ar' ? 'none' : 'rotate(180deg)' }} />
                </button>
                <h1>{locale === 'ar' ? 'رسائلي' : 'Mes Messages'}</h1>
                <div style={{ width: '40px' }} />
            </header>

            <div className="messages-list">
                {threads.length === 0 ? (
                    <div className="empty-state">
                        <FiMessageSquare size={48} />
                        <p>{locale === 'ar' ? 'لا توجد محادثات بعد' : 'Aucune conversation pour le moment'}</p>
                    </div>
                ) : (
                    threads.map(thread => (
                        <div key={thread.id} className="chat-card" onClick={() => setSelectedThread(thread)}>
                            <div className="chat-avatar">
                                <img 
                                    src={thread.institution?.logo_url || '/mockups/school-default.png'} 
                                    alt="Logo" 
                                    onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=Inst&background=random'}
                                />
                            </div>
                            <div className="chat-content">
                                <div className="chat-content-header">
                                    <span className="chat-name">{getInstitutionName(thread.institution)}</span>
                                    <span className="chat-time">{new Date(thread.last_message.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="chat-subject">{thread.subject}</div>
                                <div className="chat-preview">{thread.last_message.content}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Chat Detail Overlay */}
            {selectedThread && (
                <div className="chat-detail-overlay animate-up">
                    <header className="chat-detail-header">
                        <button className="back-btn" onClick={() => setSelectedThread(null)}>
                            <FiArrowRight style={{ transform: locale === 'ar' ? 'none' : 'rotate(180deg)' }} />
                        </button>
                        <div className="chat-avatar" style={{ width: '40px', height: '40px' }}>
                            <img src={selectedThread.institution?.logo_url} alt="Logo" />
                        </div>
                        <div className="chat-detail-info">
                            <h3>{getInstitutionName(selectedThread.institution)}</h3>
                            <p>{selectedThread.subject}</p>
                        </div>
                    </header>

                    <div className="chat-messages">
                        {/* Root Message */}
                        <div className="message-bubble sent">
                            <p>{selectedThread.content}</p>
                            <span className="bubble-time">
                                {new Date(selectedThread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Replies */}
                        {selectedThread.replies.map(reply => (
                            <div key={reply.id} className={`message-bubble ${reply.sender_id === currentUserId ? 'sent' : 'received'}`}>
                                <p>{reply.content}</p>
                                <span className="bubble-time">
                                    {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="chat-input-area">
                        <div className="input-wrapper">
                            <textarea 
                                placeholder={locale === 'ar' ? 'اكتب ردك هنا...' : 'Répondre...'} 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                disabled={sending}
                                rows={1}
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = (e.target.scrollHeight) + 'px';
                                }}
                            />
                            <button 
                                className="send-btn" 
                                onClick={handleSendReply}
                                disabled={sending || !replyText.trim()}
                            >
                                <FiSend />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
