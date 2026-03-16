import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiBell, FiSearch, FiMap, FiChevronLeft, FiPlusCircle } from 'react-icons/fi';
import { useI18n } from '../../i18n';
import { supabase } from '../../lib/supabase';

import SearchModal from '../search/SearchModal';
import MapView from '../../components/map/MapView';
import './HomeScreen.css';

// --- Sub-components (Boutique Style) ---

function InstitutionMiniCard({ inst }) {
  const navigate = useNavigate();
  const coverUrl = inst.cover_url
    ? (inst.cover_url.startsWith('http') || inst.cover_url.startsWith('/mockups/') 
        ? inst.cover_url 
        : supabase.storage.from('profiles').getPublicUrl(inst.cover_url).data.publicUrl)
    : null;

  return (
    <div className="boutique-inst-card" onClick={() => navigate(`/institution/${inst.id}`)}>
      <div className="boutique-inst-card__cover">
        {coverUrl ? <img src={coverUrl} alt={inst.name_ar} /> : <div className="placeholder">🏫</div>}
      </div>
      <div className="boutique-inst-card__info">
        <h3>{inst.name_ar}</h3>
        <p>{inst.type}</p>
      </div>
    </div>
  );
}

function ProductMiniCard({ product }) {
  const navigate = useNavigate();
  const coverUrl = product.cover_url
    ? (product.cover_url.startsWith('http') || product.cover_url.startsWith('/mockups/') 
        ? product.cover_url 
        : supabase.storage.from('product-covers').getPublicUrl(product.cover_url).data.publicUrl)
    : null;

  return (
    <div className="boutique-prod-card" onClick={() => navigate(`/store/book/${product.id}`)}>
      <div className="boutique-prod-card__cover">
        {coverUrl ? <img src={coverUrl} alt={product.name} /> : <div className="placeholder">📚</div>}
      </div>
      <div className="boutique-prod-card__info">
        <h4>{product.name}</h4>
        <span>{product.price} دج</span>
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [notifCount, setNotifCount] = useState(0);

  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  
  const [institutions, setInstitutions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 1. Initial Load (User & Wilayas)
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setUserName(profile.full_name || (locale === 'ar' ? 'زائر' : 'Visiteur'));
          if (profile.avatar_url) {
            setAvatarUrl(supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl);
          }
        }
      } else {
        setUserName(null); // Explicitly null for visitors
      }

      const { data: wData } = await supabase.from('wilayas').select('code, name_ar').order('code');
      if (wData) setWilayas(wData);
    };
    init();
  }, []);

  // 2. Synchronized Data Fetching (Driven by selectedWilaya)
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Q1: Institutions
    let instQ = supabase.from('institutions').select('*').eq('status', 'active').limit(6);
    if (selectedWilaya) instQ = instQ.eq('wilaya', selectedWilaya);

    // Q2: Announcements
    let annQ = supabase.from('announcements').select('*, institutions(name_ar)').eq('is_active', true).limit(4);
    if (selectedWilaya) annQ = annQ.eq('wilaya', selectedWilaya);

    // Q3: Store Products (Relevant to wilaya or general context)
    let prodQ = supabase.from('products').select('*').eq('status', 'active').limit(6);

    const [insts, anns, prods] = await Promise.all([instQ, annQ, prodQ]);
    
    setInstitutions(insts.data || []);
    setAnnouncements(anns.data || []);
    setProducts(prods.data || []);
    
    setLoading(false);
  }, [selectedWilaya]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'ليلة سعيدة';
  })();

  return (
    <div className="home-page boutique-theme" dir="rtl">
      {/* SECTION 1: Header + Search Hero */}
      <header className="home-header-v2">
        <div className="header-top">
          <div className="header-user">
            <div className="avatar-wrap" onClick={() => navigate('/profile')}>
              {loading ? <div className="skeleton skeleton-circle" style={{ width: '100%', height: '100%' }} /> :
               avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <div className="avatar-placeholder">👤</div>}
            </div>
            <div className="user-text">
              {loading ? (
                <>
                  <div className="skeleton skeleton-text short" />
                  <div className="skeleton skeleton-text" style={{ width: '120px', height: '18px' }} />
                </>
              ) : (
                <>
                  <p className="greeting">{greeting}،</p>
                  <h1 className="name">{userName || (locale === 'ar' ? 'زائر' : 'Visiteur')}</h1>
                </>
              )}
            </div>
          </div>
          <button className="notif-btn" onClick={() => navigate('/profile')}>
            <FiBell size={24} />
          </button>
        </div>

        <div className="section-search-trigger" onClick={() => setIsSearchOpen(true)}>
          <div className="search-bar-mock">
            <FiSearch className="search-icon" />
            <span>ابحث عن مدرسة، كتاب، أو إعلان...</span>
          </div>
        </div>
      </header>

      {/* SECTION 3: Wilaya Driver */}
      <div className="section-wilaya-driver">
        <div className="h-scroll">
          <button 
            className={`wilaya-chip ${selectedWilaya === '' ? 'active' : ''}`}
            onClick={() => setSelectedWilaya('')}
          >
            كل الجزائر
          </button>
          {wilayas.map(w => (
            <button 
              key={w.code}
              className={`wilaya-chip ${selectedWilaya === w.code ? 'active' : ''}`}
              onClick={() => setSelectedWilaya(w.code)}
            >
              {w.name_ar}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: Institutions Feed */}
      <section className="home-section-v2">
        <div className="section-header">
          <h2>المتجر</h2>
          <Link to="/search" className="view-link">الكل <FiChevronLeft /></Link>
        </div>
        <div className="h-scroll boutique-scroll">
          {loading ? [1,2,3].map(n => (
            <div key={n} className="boutique-inst-card skeleton-card-wrap">
              <div className="skeleton inst-skelton" style={{ height: '100px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
              <div style={{ padding: '12px' }}>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
              </div>
            </div>
          )) :
            institutions.length > 0 ? institutions.map(inst => <InstitutionMiniCard key={inst.id} inst={inst} />) :
            <div className="empty">لا توجد مؤسسات حالياً</div>
          }
        </div>
      </section>

      {/* SECTION 5: Announcements Feed */}
      <section className="home-section-v2">
        <div className="section-header">
          <h2>إعلانات التسجيل</h2>
          <Link to="/search" className="view-link">المزيد <FiChevronLeft /></Link>
        </div>
        <div className="announcement-list-v2">
          {loading ? [1,2].map(n => (
            <div key={n} className="ann-item-v2 skeleton-ann-wrap">
              <div className="skeleton skeleton-circle" style={{ width: '8px', height: '8px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text medium" style={{ height: '14px' }} />
                <div className="skeleton skeleton-text short" />
              </div>
            </div>
          )) :
            announcements.map(ann => (
              <div key={ann.id} className="ann-item-v2" onClick={() => navigate(`/institution/${ann.institution_id}`)}>
                <div className="ann-dot" />
                <div className="ann-body">
                  <h4>{ann.title}</h4>
                  <p>{ann.institutions?.name_ar}</p>
                </div>
                {ann.registration_open && <span className="ann-badge">مفتوح</span>}
              </div>
            ))
          }
        </div>
      </section>

      {/* SECTION 7: Map CTA */}
      <div className="home-map-cta" onClick={() => navigate('/map')}>
        <div className="cta-content">
          <h3>استكشف الخريطة</h3>
          <p>تصفح المؤسسات القريبة منك بشكل تفاعلي</p>
        </div>
        <div className="cta-icon">
          <FiMap size={24} />
        </div>
      </div>

      {/* SEARCH MODAL OVERLAY */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
