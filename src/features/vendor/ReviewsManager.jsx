import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import { FiStar, FiMessageSquare, FiTrendingUp, FiFilter, FiSearch, FiRefreshCw } from 'react-icons/fi';
import './ReviewsManager.css';

function StarRating({ rating, size = 14 }) {
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
                <FiStar
                    key={star}
                    size={size}
                    fill={star <= Math.round(rating) ? '#F59E0B' : 'transparent'}
                    stroke={star <= Math.round(rating) ? '#F59E0B' : '#CBD5E1'}
                />
            ))}
        </div>
    );
}

export default function ReviewsManager() {
    const { user } = useAuth();
    const { locale, dir } = useI18n();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avg: 0, total: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) fetchReviews();
    }, [user]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*, profiles(full_name, avatar_url), products(name)')
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);

            // Calculate stats
            if (data && data.length > 0) {
                const total = data.length;
                const sum = data.reduce((acc, r) => acc + r.rating, 0);
                setStats({ avg: (sum / total).toFixed(1), total });
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredReviews = reviews.filter(rev => 
        rev.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rev.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rev.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reviews-mgr" dir={dir}>
            <header className="reviews-mgr__header">
                <div>
                    <h1>{locale === 'ar' ? 'تقييمات العملاء' : 'Avis clients'}</h1>
                    <p>{locale === 'ar' ? 'تابع آراء عملائك وحسن من جودة منتجاتك' : 'Suivez les avis de vos clients'}</p>
                </div>
                <button className="btn-refresh" onClick={fetchReviews}>
                    <FiRefreshCw />
                </button>
            </header>

            <div className="reviews-mgr__stats-grid">
                <div className="stat-card animate-up">
                    <div className="stat-card__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                        <FiStar size={24} />
                    </div>
                    <div className="stat-card__info">
                        <h3>{stats.avg} / 5</h3>
                        <p>{locale === 'ar' ? 'متوسط التقيم' : 'Note moyenne'}</p>
                    </div>
                </div>
                <div className="stat-card animate-up" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-card__icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                        <FiMessageSquare size={24} />
                    </div>
                    <div className="stat-card__info">
                        <h3>{stats.total}</h3>
                        <p>{locale === 'ar' ? 'إجمالي المراجعات' : 'Total des avis'}</p>
                    </div>
                </div>
                <div className="stat-card animate-up" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <FiTrendingUp size={24} />
                    </div>
                    <div className="stat-card__info">
                        <h3>{Math.round((reviews.filter(r => r.rating >= 4).length / stats.total) * 100) || 0}%</h3>
                        <p>{locale === 'ar' ? 'نسبة الرضا' : 'Taux de satisfaction'}</p>
                    </div>
                </div>
            </div>

            <div className="reviews-mgr__toolbar">
                <div className="search-pill">
                    <FiSearch />
                    <input 
                        placeholder={locale === 'ar' ? 'بحث في المراجعات...' : 'Rechercher...'} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-tool-icon"><FiFilter /></button>
            </div>

            <div className="reviews-mgr__list">
                {loading ? (
                    <div className="loading-msg">{locale === 'ar' ? 'جاري تحميل المراجعات...' : 'Chargement...'}</div>
                ) : filteredReviews.length === 0 ? (
                    <div className="empty-state">
                        <FiMessageSquare size={48} />
                        <p>{locale === 'ar' ? 'لا توجد مراجعات حالياً' : 'Aucun avis pour le moment'}</p>
                    </div>
                ) : (
                    filteredReviews.map((rev, idx) => (
                        <div key={rev.id} className="review-card animate-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <div className="review-card__header">
                                <div className="reviewer-info">
                                    <div className="reviewer-avatar">
                                        {rev.profiles?.avatar_url ? (
                                            <img src={supabase.storage.from('avatars').getPublicUrl(rev.profiles.avatar_url).data.publicUrl} alt="" />
                                        ) : (
                                            rev.profiles?.full_name?.[0] || 'U'
                                        )}
                                    </div>
                                    <div className="reviewer-details">
                                        <h4>{rev.profiles?.full_name}</h4>
                                        <span className="review-date">{new Date(rev.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                                    </div>
                                </div>
                                <StarRating rating={rev.rating} />
                            </div>
                            <div className="review-card__product">
                                {locale === 'ar' ? 'على منتج:' : 'Sur le produit :'} <strong>{rev.products?.name}</strong>
                            </div>
                            <p className="review-card__comment">{rev.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
