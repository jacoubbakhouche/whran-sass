import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiHeart, FiMoreVertical, FiStar, FiShoppingBag, FiX, FiMessageSquare } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

import './ProductDetail.css';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            


            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, profiles(id, full_name, store_name, avatar_url)')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                if (data) setBook(data);
            } catch (err) {
                console.error('Error fetching product:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="product-detail-page" dir="rtl">
                <header className="product-detail-header">
                    <button className="icon-btn" onClick={() => navigate(-1)}><FiChevronLeft size={24} /></button>
                </header>
                <div className="skeleton" style={{ width: '100%', height: '350px', borderRadius: '0 0 40px 40px' }} />
                <div style={{ padding: '24px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '60%', height: '24px', marginBottom: '16px' }} />
                    <div className="skeleton skeleton-text medium" />
                    <div style={{ display: 'flex', gap: '12px', margin: '20px 0' }}>
                        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton skeleton-text short" />
                            <div className="skeleton skeleton-text" style={{ width: '120px' }} />
                        </div>
                    </div>
                    <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: '16px' }} />
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="product-detail-page empty">
                <button onClick={() => navigate(-1)}>العودة</button>
                <h3>المنتج غير موجود</h3>
            </div>
        );
    }

    const getProductImage = (url) => {
        if (!url) return null;
        return (url.startsWith('http') || url.startsWith('/mockups/'))
            ? url
            : supabase.storage.from('product-covers').getPublicUrl(url).data.publicUrl;
    };

    const productImages = [
        book.cover_url,
        book.image_url_2,
        book.image_url_3
    ].filter(Boolean).map(url => getProductImage(url));

    return (
        <div className="product-detail-page" dir="rtl">
            {/* Header */}
            <header className="product-detail-header">
                <button className="icon-btn header-back" onClick={() => navigate(-1)}>
                    <FiChevronLeft size={24} />
                </button>
                <div className="header-actions">
                    <button className="icon-btn heart-btn"><FiHeart size={20} /></button>
                    <div className="cart-btn-wrapper">
                        <button className="icon-btn cart-btn" onClick={() => navigate('/cart')}>
                            <FiShoppingBag size={20} />
                            <span className="cart-badge">2</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Product Image Slider Section */}
            <div className="product-hero-carousel">
                <div className="hero-carousel__image" style={{ transform: `translateX(${activeImageIndex * 100}%)` }}>
                    {productImages.length > 0 ? (
                        productImages.map((src, idx) => (
                            <img key={idx} src={src} alt={book.name} style={{ right: `${idx * 100}%`, position: idx === 0 ? 'relative' : 'absolute' }} />
                        ))
                    ) : (
                        <div className="placeholder-book">📚</div>
                    )}
                </div>
                
                {/* Carousel Pagination Dots */}
                <div className="carousel-dots">
                    {productImages.map((_, i) => (
                        <span 
                            key={i} 
                            className={`dot ${activeImageIndex === i ? 'active' : ''}`}
                            onClick={() => setActiveImageIndex(i)}
                        />
                    ))}
                </div>
            </div>

            {/* Product Info - Floating Sheet Look */}
            <div className="product-info-sheet animate-up">
                <div className="info-sheet__header">
                    <div className="title-price-row">
                        <h1 className="product-title">{book.name}</h1>
                        {book.colors && book.colors.length > 0 && (
                            <div className="color-options">
                                {book.colors.map(color => (
                                    <button 
                                        key={color}
                                        className={`color-dot ${selectedColor === color ? 'active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>
                        )}
                    <div className="rating-row">
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <FiStar key={star} size={18} fill="#FFD700" color="#FFD700" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="price-tag">{book.discount_price || book.price} دج</div>
                </div>

                {/* Vendor Section */}
                {book.profiles && (
                    <div className="vendor-badge-sticky" onClick={() => book.seller_id && navigate(`/store/profile/${book.seller_id}`)}>
                        <div className="vendor-info-mini">
                            <div className="vendor-avatar-mini">
                                {book.profiles.avatar_url ? (
                                    <img 
                                        src={book.profiles.avatar_url.startsWith('http') 
                                            ? book.profiles.avatar_url 
                                            : supabase.storage.from('profiles').getPublicUrl(book.profiles.avatar_url).data.publicUrl} 
                                        alt="" 
                                    />
                                ) : (
                                    <span>🏪</span>
                                )}
                            </div>
                            <div className="vendor-text-mini">
                                <span className="vendor-name-mini">{book.profiles.store_name || book.profiles.full_name}</span>
                                <span className="vendor-label-mini">متجر موثوق</span>
                            </div>
                        </div>
                        <FiChevronLeft className="vendor-arrow-mini" size={18} />
                    </div>
                )}

                {/* Size Selector */}
                {book.sizes && book.sizes.length > 0 && (
                    <div className="selection-section">
                        <h4 className="section-label">حجمك (Your Size)</h4>
                        <div className="size-grid">
                            {book.sizes.map(size => (
                                <button 
                                    key={size}
                                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="description-section">
                    <h4 className="section-label">الوصف</h4>
                    <p className="product-description">
                        {book.description || "هذا المنتج مختار بعناية لتمثيل الجودة الرفيعة والمتانة، مناسب جداً للاستخدام اليومي والمهني."}
                    </p>
                </div>

                {/* Sticky Action Button */}
                <div className="product-footer-actions">
                    <button 
                        className="btn-add-to-cart-premium"
                        onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) { navigate('/login'); return; }
                            
                            try {
                                const { error } = await supabase
                                    .from('cart')
                                    .upsert({ 
                                        user_id: user.id, 
                                        product_id: book.id,
                                        quantity: 1,
                                        metadata: { 
                                            ...(selectedSize && { size: selectedSize }), 
                                            ...(selectedColor && { color: selectedColor }) 
                                        }
                                    }, { onConflict: 'user_id, product_id' });
                                
                                if (error) throw error;
                                alert('تمت الإضافة إلى السلة بنجاح! 🛒');
                            } catch (err) {
                                console.error('Error:', err);
                            }
                        }}
                    >
                        شراء الآن
                    </button>
                    <button className="btn-contact-seller" onClick={() => setIsMessageModalOpen(true)}>
                        تواصل مع البائع
                    </button>
                </div>

                {/* Message Modal */}
                {isMessageModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsMessageModalOpen(false)}>
                        <div className="message-modal glass animate-up" onClick={e => e.stopPropagation()}>
                            <div className="message-modal__header">
                                <h3>تواصل مع المتجر</h3>
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
                                        .from('institution_messages') 
                                        .insert([{
                                            institution_id: book.seller_id,
                                            sender_id: user.id,
                                            sender_name: user.user_metadata?.full_name || user.email,
                                            subject: `استفسار عن: ${book.name}`,
                                            content: messageContent,
                                            type: 'store_query'
                                        }]);
                                    
                                    if (error) throw error;
                                    alert('تم إرسال رسالتك بنجاح!');
                                    setIsMessageModalOpen(false);
                                    setMessageContent('');
                                } catch (err) {
                                    alert(err.message);
                                } finally {
                                    setSendingMessage(false);
                                }
                            }}>
                                <p className="recipient-label">إلى: <strong>{book.profiles.store_name || book.profiles.full_name}</strong></p>
                                <textarea 
                                    placeholder="اكتب استفسارك هنا..."
                                    value={messageContent}
                                    onChange={e => setMessageContent(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn-send-message" disabled={sendingMessage}>
                                    {sendingMessage ? '...' : 'إرسال الرسالة'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
