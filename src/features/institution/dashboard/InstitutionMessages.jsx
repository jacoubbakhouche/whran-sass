import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { FiSend, FiSearch, FiMessageSquare } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import Skeleton from '../../../components/ui/Skeleton';
import './InstitutionMessages.css';

export default function InstitutionMessages() {
    const { locale, dir } = useI18n();
    const { institution } = useOutletContext();
    const [activeTab, setActiveTab] = useState('inbox');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!institution) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('institution_messages')
                    .select('*')
                    .eq('institution_id', institution.id)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                // Group messages into threads
                // Only messages where reply_to is null are roots
                const rootMessages = data.filter(m => !m.reply_to);
                const replies = data.filter(m => !!m.reply_to);

                const threadList = rootMessages.map(root => {
                    const threadReplies = replies
                        .filter(r => r.reply_to === root.id)
                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    
                    const lastMsg = threadReplies.length > 0 ? threadReplies[threadReplies.length - 1] : root;
                    return {
                        ...root,
                        replies: threadReplies,
                        last_message: lastMsg,
                        // Consistently show the client name in sidebar
                        client_name: root.sender_name 
                    };
                }).sort((a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at));

                setMessages(threadList);
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [institution]);

    const filteredMessages = messages.filter(m => {
        // Search in client name, subject or LATEST message content
        const matchesSearch = m.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             m.last_message.content?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const unreadCount = messages.filter(m => !m.is_read && !m.reply_to).length;

    const markAsRead = async (msg) => {
        if (msg.is_read) return;
        try {
            await supabase
                .from('institution_messages')
                .update({ is_read: true })
                .eq('id', msg.id);
            
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleSelectMessage = (msg) => {
        setSelectedMessage(msg);
        markAsRead(msg);
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedMessage || !institution) return;
        setSending(true);
        try {
            const { data, error } = await supabase
                .from('institution_messages')
                .insert([{
                    institution_id: institution.id,
                    sender_id: (await supabase.auth.getUser()).data.user.id,
                    recipient_id: selectedMessage.sender_id,
                    sender_name: institution.name_ar || institution.name_fr,
                    sender_avatar: institution.logo_url,
                    subject: `Re: ${selectedMessage.subject}`,
                    content: replyText,
                    reply_to: selectedMessage.id
                }])
                .select();

            if (error) throw error;
            if (data) {
                const newReply = data[0];
                setSelectedMessage(prev => ({
                    ...prev,
                    replies: [...prev.replies, newReply],
                    last_message: newReply
                }));
                setMessages(prev => prev.map(m => 
                    m.id === selectedMessage.id 
                    ? { ...m, replies: [...m.replies, newReply], last_message: newReply } 
                    : m
                ).sort((a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at)));
                setReplyText('');
            }
        } catch (err) {
            alert(locale === 'ar' ? 'حدث خطأ أثناء إرسال الرد' : 'Erreur lors de l\'envoi de la réponse');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="messages-container animate-up" dir={dir}>
            <div className="messages-header">
                <div>
                    <h1>{locale === 'ar' ? 'مركز الرسائل' : 'Messagerie'}</h1>
                    <p>{locale === 'ar' ? 'تواصل مع أولياء الأمور والطلاب' : 'Communiquez avec les parents et étudiants'}</p>
                </div>
            </div>

            <div className="messages-layout">
                {/* Sidebar */}
                <div className="messages-sidebar">
                    <div className="search-box">
                        <FiSearch />
                        <input 
                            type="text" 
                            placeholder={locale === 'ar' ? 'بحث في الرسائل...' : 'Rechercher...'} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="messages-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
                            onClick={() => setActiveTab('inbox')}
                        >
                            {locale === 'ar' ? 'البريد الوارد' : 'Boîte de réception'}
                            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sent')}
                        >
                            {locale === 'ar' ? 'المرسلة' : 'Envoyés'}
                        </button>
                    </div>

                    <div className="message-list">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="message-item">
                                    <Skeleton variant="circle" width="48px" height="48px" />
                                    <div className="message-info" style={{ flex: 1 }}>
                                        <div className="message-info-top" style={{ marginBottom: '8px' }}>
                                            <Skeleton width="100px" height="16px" />
                                            <Skeleton width="40px" height="12px" />
                                        </div>
                                        <Skeleton width="150px" height="14px" style={{ marginBottom: '6px' }} />
                                        <Skeleton width="100%" height="12px" />
                                    </div>
                                </div>
                            ))
                        ) : filteredMessages.map(msg => (
                            <div 
                                key={msg.id} 
                                className={`message-item ${selectedMessage?.id === msg.id ? 'selected' : ''} ${!msg.is_read ? 'unread' : ''}`}
                                onClick={() => handleSelectMessage(msg)}
                            >
                                <div className="avatar-container">
                                    <img src={msg.sender_avatar || `https://ui-avatars.com/api/?name=${msg.sender_name}&background=random`} alt={msg.sender_name} className="avatar" />
                                    {!msg.is_read && <span className="unread-dot"></span>}
                                </div>
                                <div className="message-info">
                                    <div className="message-info-top">
                                        <h4>{msg.client_name}</h4>
                                        <span className="time">{new Date(msg.last_message.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="subject">{msg.subject}</p>
                                    <p className="preview">{msg.last_message.content}</p>
                                </div>
                            </div>
                        ))}
                        {!loading && filteredMessages.length === 0 && (
                            <div className="empty-state">
                                <FiMessageSquare size={32} />
                                <p>{locale === 'ar' ? 'لا توجد رسائل' : 'Aucun message'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Viewer */}
                <div className={`message-viewer ${selectedMessage ? 'viewer--open' : ''}`}>
                    {selectedMessage ? (
                        <>
                            <div className="viewer-header">
                                <button className="back-btn" onClick={() => setSelectedMessage(null)}>
                                    <FiSend style={{ transform: locale === 'ar' ? 'rotate(180deg)' : 'none' }} />
                                </button>
                                <img src={selectedMessage.sender_avatar || `https://ui-avatars.com/api/?name=${selectedMessage.sender_name}&background=random`} alt={selectedMessage.sender_name} className="avatar-large" />
                                <div className="viewer-meta">
                                    <h3>{selectedMessage.sender_name}</h3>
                                    <p>{selectedMessage.subject}</p>
                                </div>
                            </div>
                            <div className="viewer-body">
                                <div className="message-bubble received">
                                    <p>{selectedMessage.content}</p>
                                    <span className="bubble-time">{new Date(selectedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {selectedMessage.replies.map(reply => (
                                    <div key={reply.id} className={`message-bubble ${reply.sender_id === selectedMessage.sender_id ? 'received' : 'sent'}`}>
                                        <p>{reply.content}</p>
                                        <span className="bubble-time">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="viewer-footer">
                                <div className="reply-box-wrapper">
                                    <div className="reply-box">
                                        <textarea 
                                            placeholder={locale === 'ar' ? 'اكتب ردك هنا...' : 'Répondre...'} 
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            disabled={sending}
                                            rows={1}
                                            onInput={(e) => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                        />
                                        <button 
                                            className="btn-send" 
                                            onClick={handleSendReply}
                                            disabled={sending || !replyText.trim()}
                                        >
                                            <FiSend />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-message-selected">
                            <div className="icon-wrapper glass">
                                <FiMessageSquare />
                            </div>
                            <h3>{locale === 'ar' ? 'مركز المراسلة' : 'Messagerie'}</h3>
                            <p>{locale === 'ar' ? 'اختر أي محادثة للبدء' : 'Sélectionnez une conversation'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
