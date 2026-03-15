import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

import './SearchResults.css';

/* ─── Type color helper ─── */
const TYPE_COLORS = {
  'حضانة': '#FF9F7F', 'روضة': '#FF9F7F',
  'ابتدائية': '#2D6A4F', 'إكمالية': '#2D6A4F', 'ثانوية': '#2D6A4F',
  'جامعة': '#1A5276', 'جامعة خاصة': '#1A5276',
  'مركز تدريب': '#E07A3A', 'مركز لغات': '#E07A3A',
  'تكوين مهني': '#B7950B',
};
function getTypeColor(type) {
  for (const k of Object.keys(TYPE_COLORS)) if (type?.includes(k)) return TYPE_COLORS[k];
  return '#2D6A4F';
}

/* ─── Institution Card ─── */
function InstitutionCard({ inst, delay = 0 }) {
  const logoUrl = inst.logo_url
    ? (inst.logo_url.startsWith('/mockups/') 
        ? inst.logo_url 
        : supabase.storage.from('institution-logos').getPublicUrl(inst.logo_url).data.publicUrl)
    : null;
  const color = getTypeColor(inst.type);
  return (
    <Link
      to={`/institution/${inst.id}`}
      className="search-inst-card card animate-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="search-inst-card__logo" style={{ borderColor: color + '33' }}>
        {logoUrl
          ? <img src={logoUrl} alt="" />
          : <span style={{ fontSize: '1.4rem' }}>🏛️</span>
        }
      </div>
      <div className="search-inst-card__body">
        <div className="search-inst-card__top">
          <h3 className="search-inst-card__name">{inst.name_ar}</h3>
          <span className="badge" style={{ background: color + '18', color }}>
            {inst.type}
          </span>
        </div>
        <span className="search-inst-card__location">
          📍 {[inst.commune, inst.wilaya].filter(Boolean).join('، ')}
        </span>
        <div className="search-inst-card__footer">
          <span className="stars">
            <span className="star-icon">⭐</span>
            <span style={{ fontFamily: 'var(--font-latin)' }}>{(inst.rating_avg || 0).toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-latin)' }}>
              ({inst.rating_count || 0})
            </span>
          </span>
          {inst.registration_open && <span className="badge badge-green">تسجيل مفتوح</span>}
        </div>
      </div>
    </Link>
  );
}

/* ─── Product Card ─── */
function ProductCard({ product, delay = 0 }) {
  const coverUrl = product.cover_url
    ? (product.cover_url.startsWith('/mockups/') 
        ? product.cover_url 
        : supabase.storage.from('product-covers').getPublicUrl(product.cover_url).data.publicUrl)
    : null;
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  return (
    <Link
      to={`/store/book/${product.id}`}
      className="search-product-card card animate-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="search-product-card__cover">
        {coverUrl ? <img src={coverUrl} alt={product.name} /> : <span>📚</span>}
      </div>
      <div className="search-product-card__body">
        <p className="search-product-card__name">{product.name}</p>
        <div className="search-product-card__price" style={{ fontFamily: 'var(--font-latin)' }}>
          {hasDiscount ? (
            <>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                {product.price} دج
              </span>
              <span style={{ color: 'var(--accent-warm)', fontWeight: 700 }}>{product.discount_price} دج</span>
            </>
          ) : (
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{product.price} دج</span>
          )}
        </div>
        {product.is_digital && <span className="badge badge-blue" style={{ fontSize: '0.6rem' }}>رقمي</span>}
      </div>
    </Link>
  );
}

/* ─── Announcement Card ─── */
function AnnCard({ ann, delay = 0 }) {
  return (
    <Link
      to={`/institution/${ann.institution_id}`}
      className="search-ann-card card animate-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="search-ann-card__header">
        <span className="search-ann-card__inst">{ann.institutions?.name_ar}</span>
        <span className={`badge ${ann.registration_open ? 'badge-green' : 'badge-orange'}`}>
          {ann.registration_open ? 'مفتوح' : 'مغلق'}
        </span>
      </div>
      <h3 className="search-ann-card__title">{ann.title}</h3>
      <p className="search-ann-card__content">{ann.content?.slice(0, 100)}{ann.content?.length > 100 ? '...' : ''}</p>
      {(ann.start_date || ann.end_date) && (
        <span className="search-ann-card__dates" style={{ fontFamily: 'var(--font-latin)' }}>
          {ann.start_date && new Date(ann.start_date).toLocaleDateString('ar-DZ')}
          {ann.end_date && ` ← ${new Date(ann.end_date).toLocaleDateString('ar-DZ')}`}
        </span>
      )}
    </Link>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [query, setQuery]   = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState('institutions');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter]   = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [regOpen, setRegOpen]   = useState(false);
  const [verified, setVerified] = useState(false);

  // Data
  const [institutions, setInstitutions] = useState([]);
  const [products, setProducts]         = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [wilayas, setWilayas]           = useState([]);
  const [loading, setLoading]           = useState(false);

  const debounceTimer = useRef(null);

  // Search institutions
  const fetchInstitutions = async (q) => {
    setLoading(true);
    let query_builder = supabase
      .from('institutions')
      .select('id, name_ar, type, logo_url, rating_avg, rating_count, wilaya, commune, registration_open')
      .eq('status', 'active');
    if (q) query_builder = query_builder.ilike('name_ar', `%${q}%`);
    if (typeFilter) query_builder = query_builder.ilike('type', `%${typeFilter}%`);
    if (wilayaFilter) query_builder = query_builder.eq('wilaya', wilayaFilter);
    if (regOpen) query_builder = query_builder.eq('registration_open', true);
    if (verified) query_builder = query_builder.eq('verified', true);
    const { data } = await query_builder.limit(30).order('rating_avg', { ascending: false });
    
    setInstitutions(data || []);
    setLoading(false);
  };

  // Search products
  const fetchProducts = async (q) => {
    setLoading(true);
    let query_builder = supabase
      .from('products')
      .select('id, name, price, discount_price, cover_url, is_digital')
      .eq('status', 'active');
    if (q) query_builder = query_builder.ilike('name', `%${q}%`);
    const { data } = await query_builder.limit(20);
    setProducts(data || []);
    setLoading(false);
  };

  // Search announcements
  const fetchAnnouncements = async (q) => {
    setLoading(true);
    let query_builder = supabase
      .from('announcements')
      .select('id, title, content, registration_open, start_date, end_date, institution_id, institutions(name_ar)')
      .eq('is_active', true);
    if (q) query_builder = query_builder.ilike('title', `%${q}%`);
    const { data } = await query_builder.limit(20).order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  // Fetch wilayas once
  useEffect(() => {
    supabase.from('wilayas').select('code, name_ar').order('code')
      .then(({ data }) => { if (data) setWilayas(data); });
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (activeTab === 'institutions') fetchInstitutions(query);
      else if (activeTab === 'products') fetchProducts(query);
      else if (activeTab === 'announcements') fetchAnnouncements(query);
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [query, activeTab, typeFilter, wilayaFilter, regOpen, verified]);

  const tabs = [
    { id: 'institutions', label: 'كل المؤسسات', count: institutions.length },
    { id: 'products', label: 'كتب المتجر', count: products.length },
    { id: 'announcements', label: 'إعلانات التسجيل', count: announcements.length },
  ];

  return (
    <div className="search-page page" dir="rtl">
      {/* ─── Search Bar ─── */}
      <div className="search-top">
        <div className="search-bar">
          <span className="search-bar__icon">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder="ابحث عن مدرسة، كتاب، إعلان..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-bar__input"
          />
          {query && (
            <button className="search-bar__clear" onClick={() => setQuery('')}>✕</button>
          )}
          <button
            className={`search-bar__filter-btn ${filtersOpen ? 'active' : ''}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            ⚙️
          </button>
        </div>

        {/* ─── Advanced Filters ─── */}
        {filtersOpen && (
          <div className="search-filters animate-up">
            <div className="search-filters__row">
              <label>نوع المؤسسة</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">الكل</option>
                {['حضانة','روضة','ابتدائية','إكمالية','ثانوية','جامعة','جامعة خاصة','مركز تدريب','مركز لغات','تكوين مهني'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="search-filters__row">
              <label>الولاية</label>
              <select value={wilayaFilter} onChange={e => setWilayaFilter(e.target.value)}>
                <option value="">كل الولايات</option>
                {wilayas.map(w => (
                  <option key={w.code} value={w.code}>{w.code} - {w.name_ar}</option>
                ))}
              </select>
            </div>
            <div className="search-filters__toggles">
              <label className="toggle-label">
                <input type="checkbox" checked={regOpen} onChange={e => setRegOpen(e.target.checked)} />
                <span>تسجيل مفتوح</span>
              </label>
              <label className="toggle-label">
                <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} />
                <span>موثقة فقط</span>
              </label>
            </div>
            {(typeFilter || wilayaFilter || regOpen || verified) && (
              <button className="search-filters__clear" onClick={() => {
                setTypeFilter(''); setWilayaFilter(''); setRegOpen(false); setVerified(false);
              }}>
                مسح الفلاتر
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Tabs ─── */}
      <div className="search-tabs h-scroll" style={{ padding: '0', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`search-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            <span className="search-tab__count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ─── Results ─── */}
      <div className="search-results-area">
        {loading ? (
          <div className="search-loading">
            {[1,2,3,4].map(n => (
              <div key={n} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)' }} />
            ))}
          </div>
        ) : (
          <>
            {/* Institutions */}
            {activeTab === 'institutions' && (
              institutions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🏫</span>
                  <h3>لم نجد مؤسسة بهذا الاسم</h3>
                  <p>جرّب بحثاً آخر أو تصفح الخريطة</p>
                </div>
              ) : (
                <div className="search-list">
                  {institutions.map((inst, i) => (
                    <InstitutionCard key={inst.id} inst={inst} delay={i * 0.04} />
                  ))}
                </div>
              )
            )}

            {/* Products */}
            {activeTab === 'products' && (
              products.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📚</span>
                  <h3>لا كتب بهذا الاسم</h3>
                </div>
              ) : (
                <div className="search-grid">
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} delay={i * 0.04} />
                  ))}
                </div>
              )
            )}

            {/* Announcements */}
            {activeTab === 'announcements' && (
              announcements.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📢</span>
                  <h3>لا إعلانات</h3>
                </div>
              ) : (
                <div className="search-list">
                  {announcements.map((ann, i) => (
                    <AnnCard key={ann.id} ann={ann} delay={i * 0.04} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
