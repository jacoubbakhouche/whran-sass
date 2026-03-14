import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingBag } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { MOCK_BOOKS } from '../../lib/mockData';
import './StoreView.css';

function BookCard({ product, layout = 'vertical' }) {
  const navigate = useNavigate();
  const coverUrl = product.cover_url
    ? (product.cover_url.startsWith('/mockups/') 
        ? product.cover_url 
        : supabase.storage.from('product-covers').getPublicUrl(product.cover_url).data.publicUrl)
    : null;

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
      </div>
      <div className="store-book-card__info">
        <h4 className="store-book-card__title">{product.name}</h4>
        <p className="store-book-card__author">{product.author || 'الجزائر التعليمية'}</p>
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

  // Tags for the sidebar
  const tags = [
    { id: 'Newest', label: 'الجديد' },
    { id: 'Novels', label: 'روايات' },
    { id: 'Popular', label: 'شائع' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data: allProds } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .limit(20);
      
      if (allProds) {
        const combined = [...MOCK_BOOKS, ...allProds];
        setProducts(combined);
        // Simulate "My Library" with a few items
        setMyLibrary(combined.slice(0, 5));
      } else {
        setProducts(MOCK_BOOKS);
        setMyLibrary(MOCK_BOOKS);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="store-page" dir="rtl">
      {/* ─── Header ─── */}
      <header className="store-header">
        <div className="store-header__user">
          <img src="/placeholder-user.jpg" alt="user" className="avatar-small" />
        </div>
        <div className="store-header__actions">
          <FiSearch size={22} className="action-icon" />
          <FiShoppingBag 
            size={22} 
            className="action-icon" 
            onClick={() => navigate('/cart')} 
            style={{ cursor: 'pointer' }}
          />
        </div>
      </header>

      {/* ─── My Library ─── */}
      <section className="store-section">
        <div className="section-header">
          <h2>مكتبتي</h2>
          <button className="view-all">مشاهدة الكل 〉</button>
        </div>
        <div className="h-scroll library-scroll">
          {myLibrary.map(item => (
            <BookCard key={item.id} product={item} layout="vertical" />
          ))}
        </div>
      </section>

      {/* ─── Bestsellers with Sidebar ─── */}
      <section className="store-section bestseller-section">
        <div className="section-header">
          <h2>الأكثر مبيعاً</h2>
          <button className="view-all">المزيد 〉</button>
        </div>
        
        <div className="bestseller-container">
          {/* Vertical Sidebar */}
          <div className="bestseller-sidebar">
            {tags.map(tag => (
              <button 
                key={tag.id}
                className={`sidebar-tag ${selectedTag === tag.id ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag.id)}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Grid/List of Bestsellers */}
          <div className="bestseller-list">
            {products.slice(0, 6).map(item => (
              <BookCard key={item.id} product={item} layout="compact" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
