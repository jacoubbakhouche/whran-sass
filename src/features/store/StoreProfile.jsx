import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiShoppingBag, FiStar, FiInfo } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';
import './StoreProfile.css';

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
    const [loading, setLoading] = useState(true);

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
                
                if (profileError) throw profileError;
                setStore(profile);

                // Fetch store products
                const { data: prods, error: prodsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('seller_id', id)
                    .eq('status', 'active');
                
                if (prodsError) throw prodsError;
                setProducts(prods || []);
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
                        {store.full_name?.[0] || '🏪'}
                    </div>
                    <h1>{store.full_name}</h1>
                    <span className="store-badge">
                        {locale === 'ar' ? 'متجر معتمد' : 'Vendeur Certifié'}
                    </span>
                    
                    <div className="store-stats">
                        <div className="stat-item">
                            <span className="stat-value">{products.length}</span>
                            <span className="stat-label">{locale === 'ar' ? 'منتج' : 'Produits'}</span>
                        </div>
                        <div className="divider" />
                        <div className="stat-item">
                            <span className="stat-value">4.8</span>
                            <span className="stat-label">{locale === 'ar' ? 'تقييم' : 'Note'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="store-content">
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
            </div>
        </div>
    );
}
