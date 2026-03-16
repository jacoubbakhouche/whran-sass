import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { INSTITUTION_TYPES, BALADIYAS } from '../../lib/mockData';
import MapView from '../../components/map/MapView';
import { FiStar, FiMapPin, FiPhone, FiMail, FiGlobe, FiUsers, FiShare2, FiChevronRight, FiChevronLeft, FiHeart, FiClock, FiX, FiMessageSquare } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import './InstitutionProfile.css';

function StarRating({ rating }) {
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
                <FiStar
                    key={star}
                    size={14}
                    fill={star <= Math.round(rating) ? '#F59E0B' : 'transparent'}
                    stroke={star <= Math.round(rating) ? '#F59E0B' : '#CBD5E1'}
                />
            ))}
        </div>
    );
}

export default function InstitutionProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, locale, dir, getField } = useI18n();
    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                // Complex query to get profile with joins
                const { data, error } = await supabase
                    .from('institutions')
                    .select(`
                        *,
                        wilayas (
                            name_ar,
                            name_fr
                        ),
                        institution_images (*),
                        institution_services (*),
                        announcements (*),
                        reviews (
                            *,
                            profiles (
                                full_name,
                                avatar_url
                            )
                        )
                    `)
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                if (data) setInstitution(data);
            } catch (err) {
                console.error('Error fetching institution profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="profile-page" dir={dir}>
                <div className="profile-hero-card">
                    <div className="skeleton" style={{ width: '100%', height: '240px', borderRadius: '0 0 32px 32px' }} />
                    <div className="profile-hero-card__content">
                        <div className="profile-logo-floating skeleton skeleton-circle" style={{ width: '80px', height: '80px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '180px', height: '28px', marginTop: '20px' }} />
                        <div className="skeleton skeleton-text medium" />
                    </div>
                </div>
                <div style={{ padding: '24px' }}>
                    <div className="skeleton skeleton-text short" style={{ marginBottom: '16px' }} />
                    <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '20px' }} />
                    <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                        <div className="skeleton" style={{ flex: 1, height: '80px', borderRadius: '16px' }} />
                        <div className="skeleton" style={{ flex: 1, height: '80px', borderRadius: '16px' }} />
                    </div>
                </div>
            </div>
        );
    }
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert(locale === 'ar' ? 'يجب عليك تسجيل الدخول لإرسال رسالة' : 'Vous devez être connecté pour envoyer un message');
            return;
        }

        setSendingMessage(true);
        try {
            const { error } = await supabase
                .from('institution_messages')
                .insert([{
                    institution_id: institution.id,
                    sender_id: user.id,
                    sender_name: user.user_metadata?.full_name || user.email,
                    sender_avatar: user.user_metadata?.avatar_url,
                    subject: locale === 'ar' ? 'استفسار من الملف الشخصي' : 'Demande via profil',
                    content: messageContent
                }]);

            if (error) throw error;

            alert(locale === 'ar' ? 'تم إرسال الرسالة بنجاح' : 'Message envoyé avec succès');
            setIsMessageModalOpen(false);
            setMessageContent('');
        } catch (err) {
            console.error('Error sending message:', err);
            alert(locale === 'ar' ? 'حدث خطأ أثناء إرسال الرسالة' : 'Erreur lors de l\'envoi du message');
        } finally {
            setSendingMessage(false);
        }
    };

    if (!institution) {
        return (
            <div className="profile-not-found" dir={dir}>
                <div className="container">
                    <span className="profile-not-found__icon">🏫</span>
                    <h2>{locale === 'ar' ? 'المؤسسة غير موجودة' : 'Établissement non trouvé'}</h2>
                    <Link to="/search" className="btn-black">
                        {locale === 'ar' ? 'العودة للبحث' : 'Retour à la recherche'}
                    </Link>
                </div>
            </div>
        );
    }

    const typeInfo = INSTITUTION_TYPES.find(t => getField(t, 'name') === institution.type) || INSTITUTION_TYPES[0];
    const services = institution.institution_services || [];
    const getImageUrl = (url, bucket = 'profiles') => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('/mockups/')) return url;
        return supabase.storage.from(bucket).getPublicUrl(url).data.publicUrl;
    };

    const logoUrl = getImageUrl(institution.logo_url);
    const coverUrl = getImageUrl(institution.cover_url);

    const announcements = institution.announcements || [];
    const reviews = institution.reviews || [];

    return (
        <div className="profile-page" dir={dir}>
            {/* Header / Nav */}
            <div className="profile-header-nav">
                <button className="icon-btn" onClick={() => navigate(-1)}>
                    {dir === 'rtl' ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
                </button>
                <div className="header-actions">
                    <button className="icon-btn">
                        <FiHeart size={22} />
                    </button>
                    <button className="icon-btn" style={{ marginInlineStart: '8px' }}>
                        <FiShare2 size={20} />
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="profile-hero-card">
                <div 
                    className="profile-hero-card__bg" 
                    style={{ 
                        backgroundColor: typeInfo?.color + '20',
                        backgroundImage: coverUrl ? `url(${coverUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {!coverUrl && (
                        <div className="profile-hero-card__icon" style={{ color: typeInfo?.color }}>
                            {typeInfo?.icon}
                        </div>
                    )}
                </div>
                <div className="profile-hero-card__content">
                    {logoUrl && (
                        <div className="profile-logo-floating">
                            <img src={logoUrl} alt="Logo" />
                        </div>
                    )}
                    <span className="tag" style={{ background: typeInfo?.color + '15', color: typeInfo?.color }}>
                        {getField(typeInfo, 'name')}
                    </span>
                    <h1 className="profile-title">{getField(institution, 'name')}</h1>
                    
                    <div className="profile-meta">
                        <div className="profile-meta__item">
                            <FiMapPin size={14} />
                            <span>
                                {institution.commune || ''}
                                {institution.commune ? '، ' : ''}
                                {getField(institution.wilayas, 'name')}
                            </span>
                        </div>
                        <div className="profile-meta__item profile-rating">
                            <FiStar size={14} fill="#F59E0B" stroke="#F59E0B" />
                            <span>{institution.rating_avg || 0}</span>
                            <span className="text-muted">({institution.rating_count || 0} {t('reviews')})</span>
                        </div>
                        {institution.students_count && (
                            <div className="profile-meta__item">
                                <FiUsers size={14} />
                                <span>{institution.students_count.toLocaleString()} {t('students')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="profile-content">
                {/* About */}
                <section className="profile-section">
                    <h2 className="section-title">
                        {locale === 'ar' ? 'حول المؤسسة' : 'À propos'}
                    </h2>
                    <p className="section-text">{institution.description}</p>
                    
                    <div className="profile-features-grid">
                        {institution.has_transport && <span className="tag-outline">🚍 {locale === 'ar' ? 'نقل مدرسي' : 'Transport'}</span>}
                        {institution.has_canteen && <span className="tag-outline">🍱 {locale === 'ar' ? 'مطعم' : 'Cantine'}</span>}
                        {institution.is_private && <span className="tag-outline">💎 {locale === 'ar' ? 'خاصة' : 'Privé'}</span>}
                    </div>
                </section>
                
                {/* Announcements */}
                {announcements.length > 0 && (
                    <section className="profile-section">
                        <h2 className="section-title">
                            {locale === 'ar' ? 'الإعلانات' : 'Annonces'}
                        </h2>
                        <div className="h-scroll">
                            {announcements.map(ann => (
                                <div 
                                    key={ann.id} 
                                    className="ann-item-card card"
                                    onClick={() => setSelectedAnnouncement(ann)}
                                >
                                    <div className="ann-item-card__date">
                                        <FiClock size={12} />
                                        <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="ann-item-card__title">{getField(ann, 'title')}</h3>
                                    <p className="ann-item-card__snippet">
                                        {getField(ann, 'content')?.substring(0, 60)}...
                                    </p>
                                    <span className="ann-item-card__more">
                                        {locale === 'ar' ? 'اقرأ المزيد' : 'Lire la suite'}
                                        {dir === 'rtl' ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                
                {/* Services / Programs omitted if empty... */}

                {/* Contact Info Grid */}
                <section className="profile-section contact-section">
                    <h2 className="section-title">{t('contactInfo')}</h2>
                    <div className="contact-grid">
                        {institution.address_detail && (
                            <div className="contact-item">
                                <div className="contact-icon"><FiMapPin size={18} /></div>
                                <div className="contact-details">
                                    <span className="contact-label">{t('address')}</span>
                                    <span className="contact-value">{institution.address_detail}</span>
                                </div>
                            </div>
                        )}
                        {institution.phone && (
                            <div className="contact-item">
                                <div className="contact-icon"><FiPhone size={18} /></div>
                                <div className="contact-details">
                                    <span className="contact-label">{t('phone')}</span>
                                    <a href={`tel:${institution.phone}`} className="contact-value link">
                                        {institution.phone}
                                    </a>
                                </div>
                            </div>
                        )}
                        {institution.email && (
                            <div className="contact-item">
                                <div className="contact-icon"><FiMail size={18} /></div>
                                <div className="contact-details">
                                    <span className="contact-label">{t('email')}</span>
                                    <a href={`mailto:${institution.email}`} className="contact-value link">
                                        {institution.email}
                                    </a>
                                </div>
                            </div>
                        )}
                        {institution.website && (
                            <div className="contact-item">
                                <div className="contact-icon"><FiGlobe size={18} /></div>
                                <div className="contact-details">
                                    <span className="contact-label">{t('website')}</span>
                                    <a href={institution.website} target="_blank" rel="noopener" className="contact-value link">
                                        {institution.website.replace('https://', '')}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Map View */}
                {(institution.lat && institution.lng) && (
                    <section className="profile-section">
                        <h2 className="section-title">{t('openOnMap')}</h2>
                        <div className="map-container-rounded">
                            <MapView
                                institutions={[institution]}
                                height="200px"
                            />
                        </div>
                    </section>
                )}

                {/* Reviews */}
                <section className="profile-section">
                    <div className="section-header">
                        <h2 className="section-title" style={{ marginBottom: 0 }}>{t('reviews')}</h2>
                        <button className="tag-black">{t('writeReview')}</button>
                    </div>

                    <div className="reviews-list">
                        {reviews.length > 0 ? reviews.map(review => (
                            <div key={review.id} className="review-card">
                                <div className="review-card__header">
                                    <div className="review-avatar">
                                        {(review.profiles?.full_name || 'U').charAt(0)}
                                    </div>
                                    <div className="review-meta-info">
                                        <h4>{review.profiles?.full_name || 'User'}</h4>
                                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <StarRating rating={review.rating} />
                                </div>
                                <p className="review-comment">
                                    {review.comment}
                                </p>
                            </div>
                        )) : (
                            <p className="no-reviews">
                                {locale === 'ar' ? 'لا توجد تقييمات بعد' : 'Aucun avis pour le moment'}
                            </p>
                        )}
                    </div>
                </section>
            </div>

            {/* Announcement Modal */}
            {selectedAnnouncement && (
                <div className="ann-modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
                    <div className="ann-details-modal glass animate-up" onClick={e => e.stopPropagation()}>
                        <div className="ann-details-modal__header">
                            <span className="badge-primary">
                                <FiClock />
                                {new Date(selectedAnnouncement.created_at).toLocaleDateString()}
                            </span>
                            <button className="close-btn" onClick={() => setSelectedAnnouncement(null)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="ann-details-modal__body">
                            <h1>{getField(selectedAnnouncement, 'title')}</h1>
                            <div className="divider" />
                            <p>{getField(selectedAnnouncement, 'content')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {isMessageModalOpen && (
                <div className="ann-modal-overlay" onClick={() => setIsMessageModalOpen(false)}>
                    <div className="ann-details-modal glass animate-up" onClick={e => e.stopPropagation()}>
                        <div className="ann-details-modal__header">
                            <h3>{locale === 'ar' ? 'إرسال رسالة' : 'Envoyer un message'}</h3>
                            <button className="close-btn" onClick={() => setIsMessageModalOpen(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="ann-details-modal__body">
                            <form onSubmit={handleSendMessage}>
                                <textarea 
                                    className="message-textarea"
                                    placeholder={locale === 'ar' ? 'اكتب رسالتك هنا...' : 'Écrivez votre message ici...'}
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    required
                                    rows={6}
                                />
                                <button type="submit" className="btn-pill btn-primary w-full mt-4" disabled={sendingMessage}>
                                    {sendingMessage ? '...' : (locale === 'ar' ? 'إرسال الآن' : 'Envoyer maintenant')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Sticky Action */}
            <div className="profile-sticky-action">
                <div className="sticky-action-container">
                    <button 
                        className="btn-pill btn-outline-primary shadow-lg"
                        style={{ padding: '12px 20px', minWidth: '60px' }}
                        onClick={() => setIsMessageModalOpen(true)}
                    >
                        <FiMessageSquare size={20} />
                    </button>
                    <button className="btn-pill btn-primary shadow-lg flex-grow">
                        <FiPhone size={18} />
                        <span>{locale === 'ar' ? 'اتصل الآن' : 'Appeler'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
