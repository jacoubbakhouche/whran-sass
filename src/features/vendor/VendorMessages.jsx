import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import { FiSend, FiSearch, FiMessageSquare, FiUser, FiClock, FiCheck } from 'react-icons/fi';
import './VendorMessages.css';

export default function VendorMessages() {
    const { user } = useAuth();
    const { locale, dir } = useI18n();
    const [messages, setMessages] = useState([]);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (user) fetchMessages();
    }, [user]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('institution_messages')
                .select('*')
                .eq('institution_id', user.id) // seller_id is mapped to institution_id for now
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error('Error fetching vendor messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (msgId) => {
        try {
            await supabase
                .from('institution_messages')
                .update({ is_read: true })
                .eq('id', msgId);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleSelect = (msg) => {
        setSelectedMsg(msg);
        if (!msg.is_read) markAsRead(msg.id);
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedMsg) return;
        setSending(true);
        try {
            // Check if profiles table has vendor info for reply
            const { data: profile } = await supabase.from('profiles').select('store_name, avatar_url').eq('id', user.id).single();

            const { data, error } = await supabase
                .from('institution_messages')
                .insert([{
                    institution_id: selectedMsg.sender_id, // Send back to user
                    sender_id: user.id,
                    sender_name: profile?.store_name || 'Vendor',
                    sender_avatar: profile?.avatar_url,
                    subject: `Re: ${selectedMsg.subject}`,
                    content: replyText,
                    reply_to: selectedMsg.id,
                    type: 'vendor_reply'
                }])
                .select();

            if (error) throw error;
            alert(locale === 'ar' ? 'تم إرسال الرد بنجاح' : 'Réponse envoyée avec succès');
            setReplyText('');
            // Optional: update local messages list or just stay in conversation
        } catch (err) {
            console.error('Error sending reply:', err);
            alert(locale === 'ar' ? 'حدث خطأ أثناء الإرسال' : 'Erreur d\'envoi');
        } finally {
            setSending(false);
        }
    };

    const filteredMessages = messages.filter(m => 
        !m.reply_to && ( // Only show inquiries in list
            m.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className={`vendor-msgs ${selectedMsg ? 'has-selected' : ''}`} dir={dir}>
            <div className="vendor-msgs__sidebar">
                <header className="sidebar-header">
                    <h1>{locale === 'ar' ? 'الرسائل' : 'Messages'}</h1>
                    <div className="search-box">
                        <FiSearch />
                        <input 
                            placeholder={locale === 'ar' ? 'بحث...' : 'Recherche...'} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                <div className="msg-list">
                    {loading ? (
                        <div className="msg-status">{locale === 'ar' ? 'جاري التحميل...' : 'Chargement...'}</div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="msg-status empty">
                            <FiMessageSquare size={32} />
                            <p>{locale === 'ar' ? 'لا توجد رسائل' : 'Aucun message'}</p>
                        </div>
                    ) : (
                        filteredMessages.map(msg => (
                            <div 
                                key={msg.id} 
                                className={`msg-item ${selectedMsg?.id === msg.id ? 'active' : ''} ${!msg.is_read ? 'unread' : ''}`}
                                onClick={() => handleSelect(msg)}
                            >
                                <div className="msg-item__avatar">
                                    {msg.sender_avatar ? (
                                        <img src={msg.sender_avatar} alt="" />
                                    ) : (
                                        <FiUser />
                                    )}
                                </div>
                                <div className="msg-item__content">
                                    <div className="name-row">
                                        <h4>{msg.sender_name}</h4>
                                        <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="subject">{msg.subject}</p>
                                    <p className="preview">{msg.content}</p>
                                </div>
                                {!msg.is_read && <div className="unread-dot" />}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <main className="vendor-msgs__chat">
                {selectedMsg ? (
                    <>
                        <header className="chat-header">
                            <div className="name-info">
                                <h3>{selectedMsg.sender_name}</h3>
                                <p>{selectedMsg.subject}</p>
                            </div>
                            <div className="chat-actions">
                                <span className={`status-tag ${selectedMsg.is_read ? 'read' : ''}`}>
                                    {selectedMsg.is_read ? <FiCheck /> : <FiClock />}
                                    {selectedMsg.is_read ? (locale === 'ar' ? 'تمت القراءة' : 'Lu') : (locale === 'ar' ? 'جديد' : 'Nouveau')}
                                </span>
                            </div>
                        </header>

                        <div className="chat-body">
                            <div className="bubble received animate-fade">
                                <p>{selectedMsg.content}</p>
                                <span className="time">{new Date(selectedMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {messages.filter(m => m.reply_to === selectedMsg.id).map(rep => (
                                <div key={rep.id} className="bubble sent animate-fade">
                                    <p>{rep.content}</p>
                                    <span className="time">{new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                        </div>

                        <footer className="chat-footer">
                            <div className="reply-input">
                                <textarea 
                                    placeholder={locale === 'ar' ? 'اكتب ردك هنا...' : 'Écrivez votre réponse...'}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    disabled={sending}
                                />
                                <button 
                                    className="btn-send-reply" 
                                    onClick={handleReply}
                                    disabled={sending || !replyText.trim()}
                                >
                                    {sending ? '...' : <FiSend />}
                                </button>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="chat-placeholder">
                        <div className="placeholder-icon">
                            <FiMessageSquare size={64} />
                        </div>
                        <h3>{locale === 'ar' ? 'اختر محادثة' : 'Sélectionnez une conversation'}</h3>
                        <p>{locale === 'ar' ? 'ابدأ في الرد على استفسارات عملائك' : 'Commencez à répondre à vos clients'}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
