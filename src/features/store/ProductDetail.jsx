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
                <button className="icon-btn" onClick={() => navigate(-1)}>
                    <FiChevronLeft size={24} />
                </button>
                <div className="header-actions">
                    <button className="icon-btn"><FiHeart size={20} /></button>
                    <button className="icon-btn"><FiMoreVertical size={20} /></button>
                </div>
            </header>

            {/* Book Card Visual */}
            <div className="product-visual-container">
                <div className="product-card-floating">
                    <div className="product-card-floating__inner">
                        <div className="product-card-floating__cover">
                            {coverUrl ? <img src={coverUrl} alt={book.name} /> : <div className="placeholder-book">📚</div>}
                        </div>
                        <h2 className="product-card-floating__title">{book.name}</h2>
                        <p 
                            className="product-card-floating__author"
                            onClick={() => {
                                if (book.seller_id) navigate(`/store/profile/${book.seller_id}`);
                            }}
                            style={{ cursor: 'pointer', color: 'var(--accent-warm)' }}
                        >
                            بواسطة {book.profiles?.full_name || book.author || 'الجزائر التعليمية'}
                        </p>
                        <div className="product-card-floating__rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <FiStar 
                                    key={star} 
                                    size={16} 
                                    fill={star <= (book.rating_avg || 4) ? "#F59E0B" : "transparent"} 
                                    stroke={star <= (book.rating_avg || 4) ? "#F59E0B" : "#cbd5e1"} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Book Info Content */}
            <div className="product-info-content animate-up">
                <div className="info-header">
                    <h3>الوصف</h3>
                    <span className="info-price">{book.discount_price || book.price} دج</span>
                </div>
                
                <p className="info-description">
                    {book.description || "كتاب قيم غني بالمعلومات والمهارات اللازمة للتفوق في المشوار الدراسي، مجمع من طرف أمهر الأساتذة في الجزائر."}
                </p>

                <div className="info-tags">
                    {book.category_id && <span className="tag-pill">كتاب مدرسي</span>}
                    <span className="tag-pill">رواية</span>
                    <span className="tag-pill">جديد</span>
                </div>

                <div className="info-actions">
                    <button 
                        className="btn-buy-premium"
                        onClick={async () => {
                            if (!supabase.auth.getUser()) {
                                navigate('/login');
                                return;
                            }
                            const { data: userData } = await supabase.auth.getUser();
                            const user = userData.user;
                            if (!user) {
                                navigate('/login');
                                return;
                            }

                            if (book.stock_quantity <= 0) {
                                alert(dir === 'rtl' ? 'عذراً، هذا المنتج غير متوفر حالياً' : 'Sorry, this product is out of stock');
                                return;
                            }

                            try {
                                const { error } = await supabase
                                    .from('cart')
                                    .upsert({ 
                                        user_id: user.id, 
                                        product_id: book.id,
                                        quantity: 1
                                    }, { onConflict: 'user_id, product_id' });
                                
                                if (error) throw error;
                                alert(dir === 'rtl' ? 'تمت الإضافة إلى السلة بنجاح! 🛒' : 'Added to cart! 🛒');
                                navigate('/cart');
                            } catch (err) {
                                console.error('Error adding to cart:', err);
                                alert(err.message);
                            }
                        }}
                    >
                        {book.stock_quantity <= 0 ? 'نفذت الكمية' : 'إضافة إلى السلة'}
                    </button>
                </div>
            </div>
        </div>
    );
}
