import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiHeart, FiMoreVertical, FiStar } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

import './ProductDetail.css';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState('#333333');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            


            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, profiles(full_name)')
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
            <div className="product-detail-page loading">
                <div className="skeleton" style={{ width: '80%', height: '400px', borderRadius: '24px' }} />
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

    const coverUrl = book.cover_url
        ? (book.cover_url.startsWith('http') || book.cover_url.startsWith('/mockups/') 
            ? book.cover_url 
            : supabase.storage.from('product-covers').getPublicUrl(book.cover_url).data.publicUrl)
        : null;

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
                    {coverUrl ? <img src={coverUrl} alt={book.name} /> : <div className="placeholder-book">📚</div>}
                </div>
                
                {/* Carousel Pagination Dots */}
                <div className="carousel-dots">
                    {[0, 1, 2].map(i => (
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
                        <div className="color-options">
                            {['#333333', '#FDE68A', '#F9A8D4', '#E2E8F0'].map(color => (
                                <button 
                                    key={color}
                                    className={`color-dot ${selectedColor === color ? 'active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setSelectedColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="price-tag">{book.discount_price || book.price} دج</div>
                </div>

                {/* Size Selector */}
                <div className="selection-section">
                    <h4 className="section-label">حجمك (Your Size)</h4>
                    <div className="size-grid">
                        {['S', 'M', 'L', 'XL'].map(size => (
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
                                        metadata: { size: selectedSize, color: selectedColor }
                                    }, { onConflict: 'user_id, product_id' });
                                
                                if (error) throw error;
                                alert('تمت الإضافة إلى السلة بنجاح! 🛒');
                            } catch (err) {
                                console.error('Error:', err);
                            }
                        }}
                    >
                        إضافة إلى السلة (Add to Cart)
                    </button>
                </div>
            </div>
        </div>
    );
}
