import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';
import './StoreProfile.css';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

function ProductCard({ product }) {
    const navigate = useNavigate();
    const coverUrl = product.cover_url
        ? (product.cover_url.startsWith('http') || product.cover_url.startsWith('/mockups/') 
            ? product.cover_url 
            : supabase.storage.from('product-covers').getPublicUrl(product.cover_url).data.publicUrl)
        : null;

    return (
        <div className="store-book-card" onClick={() => navigate(`/store/book/${product.id}`)}>
            <div className="store-book-card__cover">
                {coverUrl ? <img src={coverUrl} alt={product.name} /> : <div className="placeholder-book">📚</div>}
            </div>
            <div className="store-book-card__info">
                <h4 className="store-book-card__title">{product.name}</h4>
                <p className="store-book-card__price">{product.price} دج</p>
            </div>
        </div>
    );
}

export default function StoreProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { locale, dir } = useI18n();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchStoreData = async () => {
            setLoading(true);
            try {
                // Fetch store profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (profileError) {
                    console.error('Profile Fetch Error:', profileError);
                    throw profileError;
                }
                setStore(profile);

                // Fetch store products
                const { data: prods, error: prodsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('seller_id', id)
                    .eq('status', 'active');
                
                if (prodsError) throw prodsError;
                setProducts(prods || []);

                // Fetch reviews
                const { data: revs, error: revsError } = await supabase
                    .from('reviews')
                    .select('*, profiles(full_name, avatar_url)')
                    .eq('seller_id', id)
                    .order('created_at', { ascending: false });
                
                if (revsError) console.error('Reviews Error:', revsError);
                setReviews(revs || []);
            } catch (err) {
                console.error('Error fetching store profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreData();
    }, [id]);

    if (loading) {
        return (
            <div className="store-profile-page loading">
                <div className="skeleton-hero" style={{ height: '300px', background: 'rgba(255,255,255,0.05)' }} />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="store-profile-page empty">
                <button onClick={() => navigate(-1)}>العودة</button>
                <h3>المتجر غير موجود</h3>
            </div>
        );
    }

    return (
        <div className="store-profile-page" dir={dir}>
            <header className="store-profile-header">
                <div className="store-profile-nav">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <FiArrowRight size={24} />
                    </button>
                    <FiShoppingBag size={22} onClick={() => navigate('/cart')} style={{ cursor: 'pointer' }} />
                </div>

                <div className="store-hero">
                    <div className="store-avatar">
                        {store.avatar_url ? (
                            <img 
                                src={store.avatar_url.startsWith('http') 
                                    ? store.avatar_url 
                                    : supabase.storage.from('profiles').getPublicUrl(store.avatar_url).data.publicUrl} 
                                alt="" 
                            />
                        ) : (
                            store.store_name?.[0] || store.full_name?.[0] || '🏪'
                        )}
                    </div>
                    <h1>{store.store_name || store.full_name}</h1>
                    <div className="store-badge-row">
                        <span className="store-badge">
                            {locale === 'ar' ? 'متجر معتمد' : 'Vendeur Certifié'}
                        </span>
                        {store.wilaya && (
                            <span className="store-location-badge">
                                <FiMapPin size={12} />
                                {store.wilaya}
                            </span>
                        )}
                    </div>
                    
                    <div className="store-stats">
                        <div className="stat-item">
                            <span className="stat-value">{products.length}</span>
                            <span className="stat-label">{locale === 'ar' ? 'منتج' : 'Produits'}</span>
                        </div>
                        <div className="divider" />
                        <div className="stat-item">
                            <span className="stat-value">{store.rating_avg || '4.8'}</span>
                            <div className="stat-label-with-stars">
                                <StarRating rating={store.rating_avg || 4.8} size={10} />
                                <span className="stat-label">({reviews.length})</span>
                            </div>
                        </div>
                    </div>

                    {store.description && (
                        <p className="store-description-bio">{store.description}</p>
                    )}

                    <div className="store-hero-actions">
                        <button className="btn-contact-store" onClick={() => setIsMessageModalOpen(true)}>
                            <FiMessageSquare />
                            <span>{locale === 'ar' ? 'تراسل مع المتجر' : 'Contacter'}</span>
                        </button>
                        {store.phone && (
                            <a href={`tel:${store.phone}`} className="btn-call-store">
                                <FiPhone />
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <div className="store-content">
                <div className="store-tabs-nav">
                    <button className="store-tab active">{locale === 'ar' ? 'المنتجات' : 'Produits'}</button>
                    <button className="store-tab">{locale === 'ar' ? 'التقييمات' : 'Avis'}</button>
                </div>
                <h2>
                    <FiShoppingBag />
                    <span>{locale === 'ar' ? 'المنتجات المتوفرة' : 'Produits disponibles'}</span>
                </h2>

                {products.length === 0 ? (
                    <div className="empty-state">
                        <FiInfo size={40} />
                        <p>{locale === 'ar' ? 'لا توجد منتجات معروضة حالياً' : 'Aucun produit disponible pour le moment'}</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {/* Map Location Section */}
                {store.lat && store.lng && (
                    <div className="store-map-section">
                        <h2 className="section-title">
                            <FiMapPin className="title-icon" />
                            <span>{locale === 'ar' ? 'موقعنا على الخريطة' : 'Notre emplacement'}</span>
                        </h2>
                        <div className="store-map-container">
                            <MapContainer 
                                center={[store.lat, store.lng]} 
                                zoom={15} 
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={false}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap'
                                />
                                <Marker position={[store.lat, store.lng]} />
                            </MapContainer>
                        </div>
                    </div>
                )}

                {/* Reviews Section */}
                <div className="store-reviews-section">
                    <h2 className="section-title">
                        <FiStar className="title-icon" />
                        <span>{locale === 'ar' ? 'تقييمات العملاء' : 'Avis clients'}</span>
                        <button className="btn-add-review-trigger" onClick={() => setIsReviewModalOpen(true)}>
                            <FiPlusCircle />
                            {locale === 'ar' ? 'أضف تقييم' : 'Ajouter un avis'}
                        </button>
                    </h2>
                    
                    {reviews.length === 0 ? (
                        <p className="no-reviews-msg">{locale === 'ar' ? 'لا توجد تقييمات لهذا المتجر بعد' : 'Aucun avis pour ce magasin'}</p>
                    ) : (
                        <div className="reviews-list-vertical">
                            {reviews.map(review => (
                                <div key={review.id} className="review-card-mini">
                                    <div className="rc-header">
                                        <div className="rc-user">
                                            <div className="rc-avatar">
                                                {review.profiles?.avatar_url ? (
                                                    <img src={supabase.storage.from('avatars').getPublicUrl(review.profiles.avatar_url).data.publicUrl} alt="" />
                                                ) : review.profiles?.full_name?.[0] || 'U'}
                                            </div>
                                            <div className="rc-info">
                                                <span className="rc-name">{review.profiles?.full_name}</span>
                                                <StarRating rating={review.rating} size={12} />
                                            </div>
                                        </div>
                                        <span className="rc-date">{new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="rc-comment">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Message Modal */}
            {isMessageModalOpen && (
                <div className="modal-overlay" onClick={() => setIsMessageModalOpen(false)}>
                    <div className="message-modal glass animate-up" onClick={e => e.stopPropagation()}>
                        <div className="message-modal__header">
                            <h3>{locale === 'ar' ? 'تواصل مع المتجر' : 'Contacter le magasin'}</h3>
                            <button className="close-btn" onClick={() => setIsMessageModalOpen(false)}>
                                <FiX />
                            </button>
                        </div>
                        <form className="message-modal__body" onSubmit={async (e) => {
                            e.preventDefault();
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) { navigate('/login'); return; }
                            
                            setSendingMessage(true);
                            try {
                                const { error } = await supabase
                                    .from('institution_messages') // Reusing same table for now or a similar pattern
                                    .insert([{
                                        institution_id: store.id, // Assuming profile ID is used as the destination
                                        sender_id: user.id,
                                        sender_name: user.user_metadata?.full_name || user.email,
                                        subject: `استفسار عن منتج من ${store.full_name}`,
                                        content: messageContent,
                                        type: 'store_query'
                                    }]);
                                
                                if (error) throw error;
                                alert(locale === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Message envoyé!');
                                setIsMessageModalOpen(false);
                                setMessageContent('');
                            } catch (err) {
                                alert(err.message);
                            } finally {
                                setSendingMessage(false);
                            }
                        }}>
                            <p className="recipient-label">{locale === 'ar' ? 'إلى:' : 'À:'} <strong>{store.store_name || store.full_name}</strong></p>
                            <textarea 
                                placeholder={locale === 'ar' ? 'اكتب استفسارك هنا...' : 'Votre message...'}
                                value={messageContent}
                                onChange={e => setMessageContent(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn-send-message" disabled={sendingMessage}>
                                {sendingMessage ? '...' : (locale === 'ar' ? 'إرسال الرسالة' : 'Envoyer')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Review Modal */}
            {isReviewModalOpen && (
                <div className="modal-overlay" onClick={() => setIsReviewModalOpen(false)}>
                    <div className="message-modal glass animate-up" onClick={e => e.stopPropagation()}>
                        <div className="message-modal__header">
                            <h3>{locale === 'ar' ? 'أضف تقييمك' : 'Ajouter votre avis'}</h3>
                            <button className="close-btn" onClick={() => setIsReviewModalOpen(false)}>
                                <FiX />
                            </button>
                        </div>
                        <form className="message-modal__body" onSubmit={async (e) => {
                            e.preventDefault();
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) { navigate('/login'); return; }
                            
                            setSubmittingReview(true);
                            try {
                                const { error } = await supabase
                                    .from('reviews')
                                    .insert([{
                                        user_id: user.id,
                                        seller_id: id,
                                        rating: reviewRating,
                                        comment: reviewComment
                                    }]);
                                
                                if (error) throw error;
                                alert(locale === 'ar' ? 'شكراً لتقييمك!' : 'Merci pour votre avis !');
                                setIsReviewModalOpen(false);
                                setReviewComment('');
                                // Refresh reviews locally
                                window.location.reload(); 
                            } catch (err) {
                                alert(err.message);
                            } finally {
                                setSubmittingReview(false);
                            }
                        }}>
                            <div className="rating-select-row">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button 
                                        key={num} 
                                        type="button" 
                                        className={`star-select-btn ${reviewRating >= num ? 'active' : ''}`}
                                        onClick={() => setReviewRating(num)}
                                    >
                                        <FiStar fill={reviewRating >= num ? '#F59E0B' : 'transparent'} />
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                placeholder={locale === 'ar' ? 'كيف كانت تجربتك مع هذا المتجر؟' : 'Votre commentaire...'}
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn-send-message" disabled={submittingReview}>
                                {submittingReview ? '...' : (locale === 'ar' ? 'نشر التقييم' : 'Publier')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import { FiPlusCircle } from 'react-icons/fi';
