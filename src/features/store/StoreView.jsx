import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingBag } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

import './StoreView.css';

function BookCard({ product, layout = 'vertical' }) {
  const navigate = useNavigate();
  const getStoreAvatar = (profile) => {
    if (!profile || !profile.avatar_url) return null;
    return profile.avatar_url.startsWith('http') 
      ? profile.avatar_url 
      : supabase.storage.from('profiles').getPublicUrl(profile.avatar_url).data.publicUrl;
  };

  const coverUrl = product.cover_url
    ? (product.cover_url.startsWith('http') || product.cover_url.startsWith('/mockups/') 
        ? product.cover_url 
        : supabase.storage.from('product-covers').getPublicUrl(product.cover_url).data.publicUrl)
    : null;

  const storeAvatar = getStoreAvatar(product.profiles);

  return (
    <div 
      className={`store-book-card ${layout}`} 
      onClick={() => navigate(`/store/book/${product.id}`)}
    >
      <div className="store-book-card__cover">
        {coverUrl ? (
          <img src={coverUrl} alt={product.name} />
        ) : (
          <div className="store-book-card__placeholder">
            <span>{product.name?.[0] || 'B'}</span>
          </div>
        )}
        <div className="card-badge">جديد</div>
      </div>
      <div className="store-book-card__info">
        <h4 className="store-book-card__title">{product.name}</h4>
        <p className="store-book-card__author">
            <span className="sc-avatar-mini">
                {storeAvatar ? <img src={storeAvatar} alt="" /> : '🏪'}
            </span>
            {product.profiles?.store_name || product.profiles?.full_name || product.author || 'الجزائر التعليمية'}
        </p>
        <div className="store-book-card__footer">
            <span className="store-book-card__price">{product.price} دج</span>
            <button className="add-mini-btn">+</button>
        </div>
      </div>
    </div>
  );
}

export default function StoreView() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [myLibrary, setMyLibrary] = useState([]);
  const [selectedTag, setSelectedTag] = useState('Popular');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Tags for the sidebar
  const tags = [
    { id: 'Newest', label: 'الجديد' },
    { id: 'Novels', label: 'روايات' },
    { id: 'Popular', label: 'شائع' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
          if (profile) setUserProfile(profile);
      }

      const { data: allProds } = await supabase
        .from('products')
        .select('*, profiles(full_name, store_name, avatar_url)')
        .eq('status', 'active')
        .limit(20);
      
      if (allProds) {
        setProducts(allProds);
        setMyLibrary(allProds.slice(0, 5));
      } else {
        setProducts([]);
        setMyLibrary([]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="store-page" dir="rtl">
      {/* ─── Header ─── */}
      <header className="store-header-premium">
        <div className="header-top">
          <div className="store-logo-container">
            <img src="/mockups/logo.png" alt="Edu Expert" className="store-logo" />
          </div>
          <div className="store-actions">
            <div className="action-circle">
              <FiSearch size={20} />
            </div>
            <div className="action-circle badge-parent" onClick={() => navigate('/cart')}>
              <FiShoppingBag size={20} />
              <span className="cart-dot"></span>
            </div>
          </div>
        </div>
        
        <div className="search-bar-premium">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="ابحث عن كتب، أدوات، أو مذكرات..." />
        </div>
      </header>

      {/* ─── Featured Categories ─── */}
      <section className="store-section">
        <div className="section-header-premium">
          <h2>المتجر</h2>
          <button className="text-btn">عرض الكل</button>
        </div>
        <div className="h-scroll items-scroll">
          {loading ? [1,2,3].map(n => (
            <div key={n} className="store-book-card vertical" style={{ pointerEvents: 'none' }}>
              <div className="skeleton" style={{ height: '220px', width: '100%' }} />
              <div style={{ padding: '16px' }}>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
              </div>
            </div>
          )) :
            myLibrary.map(item => (
              <BookCard key={item.id} product={item} layout="vertical" />
            ))
          }
        </div>
      </section>

      {/* ─── Trending / Bestsellers ─── */}
      <section className="store-section bestseller-premium">
        <div className="section-header-premium">
          <h2>الأكثر مبيعاً</h2>
          <div className="filter-tabs">
            {tags.map(tag => (
              <button 
                key={tag.id}
                className={`filter-tab ${selectedTag === tag.id ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag.id)}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bestseller-grid">
          {loading ? [1,2,3,4].map(n => (
            <div key={n} className="store-book-card compact" style={{ pointerEvents: 'none' }}>
              <div className="skeleton" style={{ width: '100px', height: '120px' }} />
              <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
              </div>
            </div>
          )) :
            products.slice(0, 6).map(item => (
              <BookCard key={item.id} product={item} layout="compact" />
            ))
          }
        </div>
      </section>
    </div>
  );
}
