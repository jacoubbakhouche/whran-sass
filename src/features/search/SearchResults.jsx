import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';
import { INSTITUTION_TYPES } from '../../lib/mockData';

import './SearchResults.css';

/* ─── Type color helper ─── */
const TYPE_COLORS = {
  'حضانة': '#FF9F7F', 'روضة': '#FF9F7F',
  'ابتدائية': '#2D6A4F', 'إكمالية': '#2D6A4F', 'ثانوية': '#2D6A4F',
  'جامعة': '#1A5276', 'جامعة خاصة': '#1A5276',
  'مركز تدريب': '#E07A3A', 'مركز لغات': '#E07A3A',
  'تكوين مهني': '#B7950B',
  'university': '#1A5276',
  'training': '#E07A3A',
  'kindergarten': '#FF9F7F',
  'primary': '#2D6A4F',
  'middle': '#2D6A4F',
  'high': '#2D6A4F',
  'private': '#EC4899',
  'quranic': '#14B8A6',
  'private_primary': '#8B5CF6',
  'private_high': '#6366F1',
  'private_institute': '#0EA5E9',
};
function getTypeColor(type) {
  if (type && TYPE_COLORS[type]) return TYPE_COLORS[type];
  for (const k of Object.keys(TYPE_COLORS)) if (type?.includes(k)) return TYPE_COLORS[k];
  return '#2D6A4F';
}

/* ─── Institution Card ─── */
function InstitutionCard({ inst, delay = 0, texts, getName, getTypeLabel }) {
  const logoUrl = inst.logo_url
    ? (inst.logo_url.startsWith('http') || inst.logo_url.startsWith('/mockups/') 
        ? inst.logo_url 
        : supabase.storage.from('profiles').getPublicUrl(inst.logo_url).data.publicUrl)
    : null;
  const typeLabel = getTypeLabel(inst);
  const color = getTypeColor(inst.type || typeLabel);
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
          <h3 className="search-inst-card__name">{getName(inst)}</h3>
          <span className="badge" style={{ background: color + '18', color }}>
            {typeLabel}
          </span>
        </div>
        <span className="search-inst-card__location">
          📍 {[inst.commune, inst.wilaya].filter(Boolean).join(texts.locationSeparator)}
        </span>
        <div className="search-inst-card__footer">
          <span className="stars">
            <span className="star-icon">⭐</span>
            <span style={{ fontFamily: 'var(--font-latin)' }}>{(inst.rating_avg || 0).toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-latin)' }}>
              ({inst.rating_count || 0})
            </span>
          </span>
          {inst.registration_open && <span className="badge badge-green">{texts.openRegistration}</span>}
        </div>
      </div>
    </Link>
  );
}

/* ─── Product Card ─── */
function ProductCard({ product, delay = 0, texts }) {
  const coverUrl = product.cover_url
    ? (product.cover_url.startsWith('http') || product.cover_url.startsWith('/mockups/') 
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
                {product.price} {texts.currency}
              </span>
              <span style={{ color: 'var(--accent-warm)', fontWeight: 700 }}>{product.discount_price} {texts.currency}</span>
            </>
          ) : (
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{product.price} {texts.currency}</span>
          )}
        </div>
        {product.is_digital && <span className="badge badge-blue" style={{ fontSize: '0.6rem' }}>{texts.digital}</span>}
      </div>
    </Link>
  );
}

/* ─── Announcement Card ─── */
function AnnCard({ ann, delay = 0, texts, getInstName, dateLocale }) {
  return (
    <Link
      to={`/institution/${ann.institution_id}`}
      className="search-ann-card card animate-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="search-ann-card__header">
        <span className="search-ann-card__inst">{getInstName(ann.institutions)}</span>
        <span className={`badge ${ann.registration_open ? 'badge-green' : 'badge-orange'}`}>
          {ann.registration_open ? texts.open : texts.closed}
        </span>
      </div>
      <h3 className="search-ann-card__title">{ann.title}</h3>
      <p className="search-ann-card__content">{ann.content?.slice(0, 100)}{ann.content?.length > 100 ? '...' : ''}</p>
      {(ann.start_date || ann.end_date) && (
        <span className="search-ann-card__dates" style={{ fontFamily: 'var(--font-latin)' }}>
          {ann.start_date && new Date(ann.start_date).toLocaleDateString(dateLocale)}
          {ann.end_date && ` ← ${new Date(ann.end_date).toLocaleDateString(dateLocale)}`}
        </span>
      )}
    </Link>
  );
}

export default function SearchResults() {
  const { locale, dir, getField } = useI18n();
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

  const texts = (() => {
    if (locale === 'fr') {
      return {
        searchPlaceholder: 'Rechercher une école, un livre, une annonce...',
        institutionsTab: 'Tous les établissements',
        productsTab: 'Livres boutique',
        announcementsTab: 'Inscriptions',
        filters: 'Filtres',
        institutionType: 'Type d’établissement',
        all: 'Tout',
        wilaya: 'Wilaya',
        allWilayas: 'Toutes les wilayas',
        openRegistration: 'Inscriptions ouvertes',
        verifiedOnly: 'Vérifiés uniquement',
        clearFilters: 'Effacer les filtres',
        noInstitutionTitle: 'Aucun établissement trouvé',
        noInstitutionDesc: 'Essayez une autre recherche ou consultez la carte',
        noProducts: 'Aucun livre trouvé',
        noAnnouncements: 'Aucune annonce',
        open: 'Ouvert',
        closed: 'Fermé',
        digital: 'Numérique',
        currency: 'دج',
        locationSeparator: '، ',
      };
    }
    if (locale === 'tr') {
      return {
        searchPlaceholder: 'Okul, kitap, ilan ara...',
        institutionsTab: 'Tüm kurumlar',
        productsTab: 'Mağaza kitapları',
        announcementsTab: 'Kayıt ilanları',
        filters: 'Filtreler',
        institutionType: 'Kurum türü',
        all: 'Tümü',
        wilaya: 'Vilayet',
        allWilayas: 'Tüm vilayetler',
        openRegistration: 'Kayıt açık',
        verifiedOnly: 'Sadece doğrulanmış',
        clearFilters: 'Filtreleri temizle',
        noInstitutionTitle: 'Kurum bulunamadı',
        noInstitutionDesc: 'Farklı bir arama deneyin veya haritayı inceleyin',
        noProducts: 'Kitap bulunamadı',
        noAnnouncements: 'İlan yok',
        open: 'Açık',
        closed: 'Kapalı',
        digital: 'Dijital',
        currency: 'دج',
        locationSeparator: '، ',
      };
    }
    return {
      searchPlaceholder: 'ابحث عن مدرسة، كتاب، إعلان...',
      institutionsTab: 'كل المؤسسات',
      productsTab: 'كتب المتجر',
      announcementsTab: 'إعلانات التسجيل',
      filters: 'التصفية',
      institutionType: 'نوع المؤسسة',
      all: 'الكل',
      wilaya: 'الولاية',
      allWilayas: 'كل الولايات',
      openRegistration: 'تسجيل مفتوح',
      verifiedOnly: 'موثقة فقط',
      clearFilters: 'مسح الفلاتر',
      noInstitutionTitle: 'لم نجد مؤسسة بهذا الاسم',
      noInstitutionDesc: 'جرّب بحثاً آخر أو تصفح الخريطة',
      noProducts: 'لا كتب بهذا الاسم',
      noAnnouncements: 'لا إعلانات',
      open: 'مفتوح',
      closed: 'مغلق',
      digital: 'رقمي',
      currency: 'دج',
      locationSeparator: '، ',
    };
  })();

  const dateLocale = locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'tr-TR';

  const getInstitutionTypeLabel = (inst) => {
    if (!inst) return '';
    if (typeof inst.type === 'string' && inst.type.trim()) {
      const match = INSTITUTION_TYPES.find(
        (t) => t.value === inst.type || t.name_ar === inst.type || t.name_fr === inst.type
      );
      if (match) return locale === 'fr' ? match.name_fr : match.name_ar;
      return inst.type;
    }
    return '';
  };

  const getInstitutionName = (inst) => getField(inst, 'name') || inst?.name_ar || inst?.name_fr || '';

  const getInstitutionTypeOptions = () =>
    INSTITUTION_TYPES.map((type) => ({
      value: type.value || type.name_ar,
      label: locale === 'fr' ? type.name_fr : type.name_ar,
    }));

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
    { id: 'institutions', label: texts.institutionsTab, count: institutions.length },
    { id: 'products', label: texts.productsTab, count: products.length },
    { id: 'announcements', label: texts.announcementsTab, count: announcements.length },
  ];

  return (
    <div className="search-page page" dir={dir}>
      {/* ─── Search Bar ─── */}
      <div className="search-top">
        <div className="search-bar">
          <span className="search-bar__icon">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder={texts.searchPlaceholder}
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
              <label>{texts.institutionType}</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">{texts.all}</option>
                {getInstitutionTypeOptions().map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="search-filters__row">
              <label>{texts.wilaya}</label>
              <select value={wilayaFilter} onChange={e => setWilayaFilter(e.target.value)}>
                <option value="">{texts.allWilayas}</option>
                {wilayas.map(w => (
                  <option key={w.code} value={w.code}>{w.code} - {w.name_ar}</option>
                ))}
              </select>
            </div>
            <div className="search-filters__toggles">
              <label className="toggle-label">
                <input type="checkbox" checked={regOpen} onChange={e => setRegOpen(e.target.checked)} />
                <span>{texts.openRegistration}</span>
              </label>
              <label className="toggle-label">
                <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} />
                <span>{texts.verifiedOnly}</span>
              </label>
            </div>
            {(typeFilter || wilayaFilter || regOpen || verified) && (
              <button className="search-filters__clear" onClick={() => {
                setTypeFilter(''); setWilayaFilter(''); setRegOpen(false); setVerified(false);
              }}>
                {texts.clearFilters}
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
            {activeTab === 'institutions' && [1,2,3,4].map(n => (
              <div key={n} className="search-inst-card skeleton-card-wrap" style={{ display: 'flex' }}>
                <div className="skeleton skeleton-circle" style={{ width: '48px', height: '48px', margin: '12px' }} />
                <div style={{ flex: 1, padding: '12px' }}>
                  <div className="skeleton skeleton-text medium" />
                  <div className="skeleton skeleton-text short" />
                </div>
              </div>
            ))}
            {activeTab === 'products' && (
              <div className="search-grid">
                {[1,2,3,4].map(n => (
                  <div key={n} className="search-product-card skeleton-card-wrap">
                    <div className="skeleton" style={{ height: '140px', width: '100%' }} />
                    <div style={{ padding: '12px' }}>
                      <div className="skeleton skeleton-text" />
                      <div className="skeleton skeleton-text short" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'announcements' && [1,2,3].map(n => (
              <div key={n} className="search-ann-card skeleton-card-wrap" style={{ padding: '16px' }}>
                <div className="skeleton skeleton-text medium" style={{ marginBottom: '12px' }} />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Institutions */}
            {activeTab === 'institutions' && (
              institutions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🏫</span>
                  <h3>{texts.noInstitutionTitle}</h3>
                  <p>{texts.noInstitutionDesc}</p>
                </div>
              ) : (
                <div className="search-list">
                  {institutions.map((inst, i) => (
                    <InstitutionCard
                      key={inst.id}
                      inst={inst}
                      delay={i * 0.04}
                      texts={texts}
                      getName={getInstitutionName}
                      getTypeLabel={getInstitutionTypeLabel}
                    />
                  ))}
                </div>
              )
            )}

            {/* Products */}
            {activeTab === 'products' && (
              products.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📚</span>
                  <h3>{texts.noProducts}</h3>
                </div>
              ) : (
                <div className="search-grid">
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} delay={i * 0.04} texts={texts} />
                  ))}
                </div>
              )
            )}

            {/* Announcements */}
            {activeTab === 'announcements' && (
              announcements.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📢</span>
                  <h3>{texts.noAnnouncements}</h3>
                </div>
              ) : (
                <div className="search-list">
                  {announcements.map((ann, i) => (
                    <AnnCard key={ann.id} ann={ann} delay={i * 0.04} texts={texts} getInstName={getInstitutionName} dateLocale={dateLocale} />
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
