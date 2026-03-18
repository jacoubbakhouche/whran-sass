import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { INSTITUTION_TYPES } from '../../lib/mockData';
import { FiHeart, FiMapPin, FiStar, FiChevronRight } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './FavoritesView.css';

export default function FavoritesView() {
    const { t, locale, dir, getField } = useI18n();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavoritesData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            try {
                // Fetch user's favorites joined with institutions
                const { data: favData, error: favError } = await supabase
                    .from('favorites')
                    .select('*, institutions(*)')
                    .eq('user_id', user.id);
                
                if (favError) throw favError;
                if (favData) setFavorites(favData.map(f => f.institutions).filter(Boolean));

                // Fetch some random suggestions
                const { data: sugData } = await supabase
                    .from('institutions')
                    .select('*')
                    .eq('status', 'active')
                    .limit(5);
                
                if (sugData) setSuggestions(sugData);
            } catch (err) {
                console.error('Error fetching favorites:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFavoritesData();
    }, [user]);

    const resolveTypeInfo = (type) =>
        INSTITUTION_TYPES.find(t => t.value === type || t.name_ar === type || t.name_fr === type) || INSTITUTION_TYPES[0];

    const removeFavorite = async (e, instId) => {
        e.preventDefault();
        if (!user) return;

        try {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('institution_id', instId);
            
            if (error) throw error;
            setFavorites(prev => prev.filter(inst => inst.id !== instId));
        } catch (err) {
            console.error('Error removing favorite:', err);
        }
    };

    return (
        <div className="favorites-page" dir={dir}>
            <div className="favorites-header">
                <div className="user-avatar" onClick={() => navigate('/profile')}>
                    <img 
                        src={profile?.avatar_url || "https://i.pravatar.cc/150?u=default"} 
                        alt={profile?.full_name || "User"} 
                    />
                </div>
                <div className="header-actions">
                    <FiHeart size={24} className="active-heart" />
                </div>
            </div>

            <div className="favorites-content">
                <div className="section-title">
                    <h1>{locale === 'ar' ? 'مكتبتي' : 'My library'}</h1>
                    <span>{locale === 'ar' ? 'عرض الكل' : 'View all'} <FiChevronRight size={14} /></span>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        {locale === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="empty-favorites">
                        <div className="empty-icon">❤️</div>
                        <h3>{locale === 'ar' ? 'لا توجد مفضلات' : 'No favorites yet'}</h3>
                        <p>{locale === 'ar' ? 'قم بحفظ المؤسسات للرجوع إليها لاحقاً' : 'Save institutions to come back to them later'}</p>
                    </div>
                ) : (
                    <div className="favorites-grid">
                        {favorites.map((inst, index) => {
                            const typeInfo = resolveTypeInfo(inst.type);
                            return (
                                <Link to={`/institution/${inst.id}`} key={inst.id} className="favorite-card animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <button 
                                        className="favorite-toggle active" 
                                        onClick={(e) => removeFavorite(e, inst.id)}
                                    >
                                        <FiHeart size={18} fill="currentColor" />
                                    </button>
                                    
                                    <div className="favorite-card__image" style={{ background: `linear-gradient(135deg, ${typeInfo?.color}40, ${typeInfo?.color}80)` }}>
                                        <span className="favorite-card__icon">{typeInfo?.icon}</span>
                                    </div>
                                    
                                    <div className="favorite-card__info">
                                        <h3>{getField(inst, 'name')}</h3>
                                        <p className="subtitle">{inst.commune || ''}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Second section mockup as per design "Bestsellers" -> could be "Suggested" */}
                <div className="section-title mt-8">
                    <h1>{locale === 'ar' ? 'مقترحات' : 'Suggested'}</h1>
                    <span>{locale === 'ar' ? 'عرض المزيد' : 'See more'} <FiChevronRight size={14} /></span>
                </div>

                <div className="suggested-row" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px' }}>
                    {suggestions.map((inst) => {
                         const typeInfo = resolveTypeInfo(inst.type);
                         return (
                            <Link to={`/institution/${inst.id}`} key={`sug-${inst.id}`} className="suggested-card" style={{ flex: '0 0 80px' }}>
                                <div className="suggested-card__image" style={{ background: typeInfo?.color, borderRadius: '16px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                    <span style={{ fontSize: '24px' }}>{typeInfo?.icon}</span>
                                </div>
                            </Link>
                         )
                    })}
                </div>
            </div>
        </div>
    );
}
