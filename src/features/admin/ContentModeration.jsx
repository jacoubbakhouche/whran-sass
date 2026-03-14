import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { FiMessageSquare, FiFlag, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import './ContentModeration.css';

export default function ContentModeration() {
    const { t, locale, dir } = useI18n();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ pending: 0, reports: 0 });

    useEffect(() => {
        fetchModerationData();
    }, []);

    const fetchModerationData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Reviews
            const { data, error } = await supabase
                .from('reviews')
                .select('*, profiles(full_name), institutions(name_ar, name_fr)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setReviews(data || []);

            // 2. Fetch Pending Count
            const { count } = await supabase
                .from('reviews')
                .select('*', { count: 'exact', head: true })
                .eq('is_approved', false);
            
            setCounts({ pending: count || 0, reports: 5 }); // Reports table not yet fully mapped

        } catch (err) {
            console.error('Moderation Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleApproval = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ is_approved: !currentStatus })
                .eq('id', id);
            
            if (error) throw error;
            setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: !currentStatus } : r));
        } catch (err) {
            alert(err.message);
        }
    };

    const deleteReview = async (id) => {
        if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه المراجعة؟' : 'Supprimer cet avis ?')) return;
        try {
            const { error } = await supabase.from('reviews').delete().eq('id', id);
            if (error) throw error;
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="loading-screen" style={{ color: '#fff', textAlign: 'center', padding: '100px' }}>{t('loading')}...</div>;

    return (
        <div className="moderation" dir={dir}>
            <h1 className="moderation__title">{locale === 'ar' ? 'مراقبة المحتوى' : 'Modération du contenu'}</h1>

            <div className="mod-grid">
                <div className="mod-card mod-card--active">
                    <div className="mod-card__icon"><FiMessageSquare /></div>
                    <div className="mod-card__info">
                        <h3>{locale === 'ar' ? 'التعليقات والمراجعات' : 'Commentaires'}</h3>
                        <p>{counts.pending} {locale === 'ar' ? 'بانتظار المراجعة' : 'en attente'}</p>
                    </div>
                </div>
                <div className="mod-card">
                    <div className="mod-card__icon"><FiFlag /></div>
                    <div className="mod-card__info">
                        <h3>{locale === 'ar' ? 'البلاغات' : 'Signalements'}</h3>
                        <p>{counts.reports} {locale === 'ar' ? 'بلاغات جديدة' : 'nouveaux'}</p>
                    </div>
                </div>
            </div>

            <div className="report-list">
                <h2>{locale === 'ar' ? 'أحدث المراجعات' : 'Avis récents'}</h2>
                {reviews.length > 0 ? reviews.map(review => (
                    <div key={review.id} className={`report-item ${!review.is_approved ? 'report-item--pending' : ''}`}>
                        <div className="report-item__type">
                            <FiMessageSquare />
                            <span>{review.rating} ⭐</span>
                        </div>
                        <div className="report-item__content">
                            <p className="report-text">"{review.comment}"</p>
                            <div className="report-meta">
                                <strong>{review.profiles?.full_name}</strong>
                                <span className="dot" />
                                <span>{review.institutions?.name_ar || review.institutions?.name_fr}</span>
                                <span className="dot" />
                                <span>{new Date(review.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                                {!review.is_approved && <span className="reason-tag" style={{ background: '#F59E0B' }}>Pending</span>}
                            </div>
                        </div>
                        <div className="report-item__actions">
                            <button 
                                className={`mod-btn ${review.is_approved ? 'mod-btn--unapprove' : 'mod-btn--keep'}`} 
                                title={review.is_approved ? 'Hide' : 'Approve'}
                                onClick={() => toggleApproval(review.id, review.is_approved)}
                                style={{ background: review.is_approved ? '#F3F4F6' : '#DCFCE7', color: review.is_approved ? '#4B5563' : '#15803D' }}
                            >
                                {review.is_approved ? <FiX /> : <FiCheck />}
                            </button>
                            <button 
                                className="mod-btn mod-btn--delete" 
                                title="Delete"
                                onClick={() => deleteReview(review.id)}
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                )) : <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>{locale === 'ar' ? 'لا توجد مراجعات حالياً' : 'Aucun avis pour le moment'}</p>}
            </div>
        </div>
    );
}
