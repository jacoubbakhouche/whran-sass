import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiBell, FiSearch, FiMap, FiChevronLeft, FiPlusCircle, FiMapPin, FiBriefcase, FiMenu, FiMessageSquare, FiHeart, FiShoppingBag, FiSettings, FiUser, FiCheck, FiGlobe } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';
import { useI18n } from '../../i18n';
import { supabase } from '../../lib/supabase';
import { INSTITUTION_TYPES } from '../../lib/mockData';

import SearchModal from '../search/SearchModal';
import MapView from '../../components/map/MapView';
import './HomeScreen.css';

// --- Sub-components (Boutique Style) ---
const orderedInstitutionTypes = (() => {
  const nursery = INSTITUTION_TYPES.find((t) => t.value === 'kindergarten');
  const rest = INSTITUTION_TYPES.filter((t) => t.value !== 'kindergarten');
  return nursery ? [...rest, nursery] : rest;
})();

const getInstitutionTypeId = (inst) => {
  if (!inst) return '';
  if (typeof inst.type === 'string' && inst.type.trim()) {
    const match = INSTITUTION_TYPES.find((t) =>
      t.value === inst.type ||
      t.name_ar === inst.type ||
      t.name_fr === inst.type
    );
    return match ? match.value : inst.type;
  }
  return '';
};

function InstitutionMiniCardSmall({ inst, typeLabel, name }) {
  const navigate = useNavigate();
  const coverUrl = inst.cover_url
    ? (inst.cover_url.startsWith('http') || inst.cover_url.startsWith('/mockups/') 
        ? inst.cover_url 
        : supabase.storage.from('profiles').getPublicUrl(inst.cover_url).data.publicUrl)
    : null;

  return (
    <div className="inst-mini-card" onClick={() => navigate(`/institution/${inst.id}`)}>
      <div className="inst-mini-card__cover">
        {coverUrl ? <img src={coverUrl} alt={name} /> : <div className="placeholder">🏫</div>}
      </div>
      <div className="inst-mini-card__info">
        <h4>{name}</h4>
        <span>{typeLabel || inst.type}</span>
      </div>
    </div>
  );
}

function InstitutionMiniCard({ inst, texts, name }) {
  const navigate = useNavigate();
  const coverUrl = inst.cover_url
    ? (inst.cover_url.startsWith('http') || inst.cover_url.startsWith('/mockups/') 
        ? inst.cover_url 
        : supabase.storage.from('profiles').getPublicUrl(inst.cover_url).data.publicUrl)
    : null;
  const rating = typeof inst.rating_avg === 'number' ? inst.rating_avg : 4.5;
  const stars = Math.round(rating);
  const specialties = inst.specialties && Array.isArray(inst.specialties) && inst.specialties.length > 0
    ? inst.specialties.slice(0, 3)
    : texts.defaultSpecialties;

  return (
    <div className="inst-card" onClick={() => navigate(`/institution/${inst.id}`)}>
      <div className="inst-card__cover">
        {coverUrl ? <img src={coverUrl} alt={name} /> : <div className="placeholder">🏫</div>}
      </div>
      <div className="inst-card__body">
        <div className="inst-card__rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`star ${i < stars ? 'star--filled' : ''}`}>★</span>
          ))}
          <span className="inst-card__rating-value">{rating.toFixed(1)}</span>
        </div>
        <h3 className="inst-card__name">{name || texts.institutions}</h3>
        <div className="inst-card__location">
          <FiMapPin />
          <span>{inst.wilaya || texts.algiers}</span>
        </div>
        <div className="inst-card__specialties">
          <p>{texts.topSpecialties}</p>
          <ul>
            {specialties.map((spec, idx) => (
              <li key={idx}>
                <FiCheck />
                <span>{spec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="inst-card__actions">
        <button type="button" className="inst-card__btn inst-card__btn--ghost">{texts.contact}</button>
        <button type="button" className="inst-card__btn inst-card__btn--primary">{texts.register}</button>
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
  const { locale, setLocale, t, getField, dir } = useI18n();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [notifCount, setNotifCount] = useState(0);

  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [institutions, setInstitutions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [products, setProducts] = useState([]);
  const [recruitmentAds, setRecruitmentAds] = useState([]);
  const [selectedJobAd, setSelectedJobAd] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [homeQuickMenuOpen, setHomeQuickMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const quickMenuRef = useRef(null);

  // 1. Initial Load (User & Wilayas)
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setUserName(profile.full_name || '');
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

    // Q4: Recruitment ads (education jobs)
    let jobsQ = supabase.from('recruitment_ads')
      .select('*, institutions(name_ar)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4);
    if (selectedWilaya) jobsQ = jobsQ.eq('wilaya', selectedWilaya);

    const [insts, anns, prods, jobs] = await Promise.all([instQ, annQ, prodQ, jobsQ]);
    
    setInstitutions(insts.data || []);
    setAnnouncements(anns.data || []);
    setProducts(prods.data || []);
    setRecruitmentAds(jobs.data || []);
    
    setLoading(false);
  }, [selectedWilaya]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!homeQuickMenuOpen) return;

    const handleScroll = () => setHomeQuickMenuOpen(false);
    const handleClickOutside = (event) => {
      if (!quickMenuRef.current) return;
      if (!quickMenuRef.current.contains(event.target)) {
        setHomeQuickMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [homeQuickMenuOpen]);

  useEffect(() => {
    if (!homeQuickMenuOpen) setLangMenuOpen(false);
  }, [homeQuickMenuOpen]);

  const texts = (() => {
    const ar = {
      brand: 'Edu-Expert',
      quick: {
        profile: 'الملف الشخصي',
        messages: 'الرسائل',
        favorites: 'المفضلة',
        orders: 'الطلبات',
        settings: 'الإعدادات',
      },
      all: 'الكل',
      goodMorning: 'صباح الخير',
      goodAfternoon: 'مساء الخير',
      goodNight: 'ليلة سعيدة',
      visitor: 'زائر',
      searchPlaceholder: t('searchPlaceholder'),
      newInstitutions: 'المؤسسات الجديدة',
      institutions: 'المؤسسات التعليمية',
      announcements: 'إعلانات التسجيل',
      educationJobs: 'وظائف التعليم',
      exploreMap: 'استكشف الخريطة',
      exploreMapDesc: 'تصفح المؤسسات القريبة منك بشكل تفاعلي',
      viewMore: 'المزيد',
      open: 'مفتوح',
      noInstitutions: 'لا توجد مؤسسات حالياً',
      noInstitutionsInCategory: 'لا توجد مؤسسات في هذه الفئة',
      noJobs: 'لا توجد عروض توظيف حالياً',
      jobsSoon: 'سيتم عرض الوظائف الجديدة هنا',
      visitInstitution: 'زيارة ملف المؤسسة',
      topSpecialties: 'أهم التخصصات',
      contact: 'التواصل',
      register: 'إرسال طلب تسجيل',
      allAlgeria: 'كل الجزائر',
      algiers: 'الجزائر',
      quickMenu: 'قائمة سريعة',
      language: 'اللغة',
      langArabic: 'العربية',
      langFrench: 'الفرنسية',
      langTurkish: 'التركية',
      defaultSpecialties: ['التعليم الابتدائي', 'اللغة الإنجليزية', 'الدروس الخصوصية'],
    };
    const fr = {
      brand: 'Edu-Expert',
      quick: {
        profile: 'Profil',
        messages: 'Messages',
        favorites: 'Favoris',
        orders: 'Commandes',
        settings: 'Paramètres',
      },
      all: 'Tout',
      goodMorning: 'Bonjour',
      goodAfternoon: 'Bonsoir',
      goodNight: 'Bonne nuit',
      visitor: 'Visiteur',
      searchPlaceholder: t('searchPlaceholder'),
      newInstitutions: 'Nouveaux établissements',
      institutions: 'Établissements éducatifs',
      announcements: 'Inscriptions',
      educationJobs: 'Emplois éducatifs',
      exploreMap: 'Explorer la carte',
      exploreMapDesc: 'Parcourez les établissements proches de vous',
      viewMore: 'Plus',
      open: 'Ouvert',
      noInstitutions: 'Aucun établissement pour le moment',
      noInstitutionsInCategory: 'Aucun établissement dans cette catégorie',
      noJobs: 'Aucune offre pour le moment',
      jobsSoon: 'Les nouvelles offres apparaîtront ici',
      visitInstitution: 'Voir l’établissement',
      topSpecialties: 'Spécialités principales',
      contact: 'Contacter',
      register: 'Envoyer une demande',
      allAlgeria: 'Toute l’Algérie',
      algiers: 'Alger',
      quickMenu: 'Menu rapide',
      language: 'Langue',
      langArabic: 'Arabe',
      langFrench: 'Français',
      langTurkish: 'Turc',
      defaultSpecialties: ['Éducation primaire', 'Anglais', 'Cours particuliers'],
    };
    const tr = {
      brand: 'Edu-Expert',
      quick: {
        profile: 'Profil',
        messages: 'Mesajlar',
        favorites: 'Favoriler',
        orders: 'Siparişler',
        settings: 'Ayarlar',
      },
      all: 'Tümü',
      goodMorning: 'Günaydın',
      goodAfternoon: 'İyi akşamlar',
      goodNight: 'İyi geceler',
      visitor: 'Ziyaretçi',
      searchPlaceholder: t('searchPlaceholder'),
      newInstitutions: 'Yeni kurumlar',
      institutions: 'Eğitim kurumları',
      announcements: 'Kayıt duyuruları',
      educationJobs: 'Eğitim işleri',
      exploreMap: 'Haritayı keşfet',
      exploreMapDesc: 'Yakındaki kurumları keşfedin',
      viewMore: 'Daha fazla',
      open: 'Açık',
      noInstitutions: 'Şu an kurum yok',
      noInstitutionsInCategory: 'Bu kategoride kurum yok',
      noJobs: 'Şu an ilan yok',
      jobsSoon: 'Yeni ilanlar burada görünecek',
      visitInstitution: 'Kurum profili',
      topSpecialties: 'Öne çıkan uzmanlıklar',
      contact: 'İletişim',
      register: 'Başvuru gönder',
      allAlgeria: 'Tüm Cezayir',
      algiers: 'Cezayir',
      quickMenu: 'Hızlı menü',
      language: 'Dil',
      langArabic: 'Arapça',
      langFrench: 'Fransızca',
      langTurkish: 'Türkçe',
      defaultSpecialties: ['İlkokul', 'İngilizce', 'Özel dersler'],
    };
    if (locale === 'fr') return fr;
    if (locale === 'tr') return tr;
    return ar;
  })();

  const quickNavItems = [
    { label: texts.quick.profile, path: '/profile', icon: <FiUser /> },
    { label: texts.quick.messages, path: '/profile/messages', icon: <FiMessageSquare /> },
    { label: texts.quick.favorites, path: '/favorites', icon: <FiHeart /> },
    { label: texts.quick.orders, path: '/orders', icon: <FiShoppingBag /> },
    { label: texts.quick.settings, path: '/settings', icon: <FiSettings /> },
  ];

  const categoryOptions = [
    { id: 'all', label: texts.all },
    ...orderedInstitutionTypes.map((type) => ({
      id: type.value,
      label: locale === 'fr' ? type.name_fr : type.name_ar,
    })),
  ];

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

  const getInstitutionName = (inst) => {
    if (!inst) return '';
    return getField(inst, 'name') || inst.name_ar || inst.name_fr || '';
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return texts.goodMorning;
    if (h < 18) return texts.goodAfternoon;
    return texts.goodNight;
  })();
  const greetingPunct = locale === 'ar' ? '،' : ',';

  const jobTypeLabel = (type) => {
    const map = {
      teacher: { ar: 'أستاذ', fr: 'Enseignant', tr: 'Öğretmen' },
      admin: { ar: 'إداري', fr: 'Administratif', tr: 'İdari' },
      counselor: { ar: 'مستشار توجيه', fr: 'Conseiller', tr: 'Danışman' },
      supervisor: { ar: 'مشرف تربوي', fr: 'Superviseur', tr: 'Gözetmen' },
      technician: { ar: 'تقني', fr: 'Technicien', tr: 'Teknisyen' },
      other: { ar: 'آخر', fr: 'Autre', tr: 'Diğer' },
    };
    return map[type]?.[locale] || type;
  };

  const dateLocale = locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'tr-TR';

  const filteredInstitutions =
    selectedCategory === 'all'
      ? institutions
      : institutions.filter((inst) => getInstitutionTypeId(inst) === selectedCategory);

  return (
    <div className="home-page boutique-theme" dir={dir}>
      {/* SECTION 1: Header + Search Hero */}
      <header className="home-header-v2">
        <FaGraduationCap className="header-watermark" aria-hidden="true" />
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
                  <div className="header-brand">
                    <FaGraduationCap />
                    <span>{texts.brand}</span>
                  </div>
                  <p className="greeting">{greeting}{greetingPunct}</p>
                  <h1 className="name">{userName || texts.visitor}</h1>
                </>
              )}
            </div>
          </div>
          <div className="home-header-actions">
            <button className="notif-btn" onClick={() => navigate('/profile')}>
              <FiBell size={24} />
            </button>
            <div className="home-quick-menu-wrap">
              <button
                type="button"
                className="quick-menu-trigger quick-menu-trigger--home"
                onClick={() => setHomeQuickMenuOpen((prev) => !prev)}
                aria-label={texts.quickMenu}
              >
                <FiMenu size={18} />
              </button>
              {homeQuickMenuOpen && (
                <>
                  <div
                    className="home-quick-menu-backdrop"
                    onClick={() => setHomeQuickMenuOpen(false)}
                  />
                  <div className="home-quick-menu" role="menu" ref={quickMenuRef}>
                    {quickNavItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="home-quick-menu__item"
                        onClick={() => {
                          setHomeQuickMenuOpen(false);
                          navigate(item.path);
                        }}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="home-quick-menu__item home-quick-menu__item--lang"
                      onClick={() => setLangMenuOpen((prev) => !prev)}
                    >
                      <FiGlobe />
                      <span>{texts.language}</span>
                      <span className="home-quick-menu__lang-pill">
                        {locale === 'ar' ? texts.langArabic : locale === 'fr' ? texts.langFrench : texts.langTurkish}
                      </span>
                    </button>
                    {langMenuOpen && (
                      <div className="home-quick-menu__sub" role="group">
                        <button
                          type="button"
                          className="home-quick-menu__sub-item"
                          onClick={() => {
                            setLocale('ar');
                            setHomeQuickMenuOpen(false);
                          }}
                        >
                          {texts.langArabic}
                        </button>
                        <button
                          type="button"
                          className="home-quick-menu__sub-item"
                          onClick={() => {
                            setLocale('fr');
                            setHomeQuickMenuOpen(false);
                          }}
                        >
                          {texts.langFrench}
                        </button>
                        <button
                          type="button"
                          className="home-quick-menu__sub-item"
                          onClick={() => {
                            setLocale('tr');
                            setHomeQuickMenuOpen(false);
                          }}
                        >
                          {texts.langTurkish}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="section-search-trigger" onClick={() => setIsSearchOpen(true)}>
          <div className="search-bar-mock">
            <FiSearch className="search-icon" />
            <span>{texts.searchPlaceholder}</span>
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
            {texts.allAlgeria}
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

      {/* SECTION 3.5: Category Driver */}
      <div className="section-category-driver">
        <div className="h-scroll">
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip ${cat.id === 'all' ? 'category-chip--all' : ''} ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: Mini Institutions Carousel */}
      <section className="home-section-v2">
        <div className="section-header">
          <h2>{texts.newInstitutions}</h2>
          <Link to="/search" className="view-link">{texts.all} <FiChevronLeft /></Link>
        </div>
        <div className="h-scroll boutique-scroll">
          {loading ? [1,2,3,4].map(n => (
            <div key={n} className="inst-mini-card skeleton-card-wrap">
              <div className="skeleton" style={{ height: '90px', borderRadius: '14px 14px 0 0' }} />
              <div style={{ padding: '10px' }}>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
              </div>
            </div>
          )) :
            filteredInstitutions.length > 0 ? filteredInstitutions.map(inst => (
              <InstitutionMiniCardSmall
                key={`mini-${inst.id}`}
                inst={inst}
                name={getInstitutionName(inst)}
                typeLabel={getInstitutionTypeLabel(inst)}
              />
            )) :
            <div className="empty">{texts.noInstitutionsInCategory}</div>
          }
        </div>
      </section>

      {/* SECTION 5: Institutions Feed */}
      <section className="home-section-v2">
        <div className="section-header">
          <h2>{texts.institutions}</h2>
          <Link to="/search" className="view-link">{texts.all} <FiChevronLeft /></Link>
        </div>
        <div className="inst-card-scroll">
          {loading ? [1,2,3].map(n => (
            <div key={n} className="inst-card skeleton-card-wrap">
              <div className="skeleton inst-skelton" style={{ height: '160px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
              <div style={{ padding: '16px' }}>
                <div className="skeleton skeleton-text" style={{ width: '140px' }} />
                <div className="skeleton skeleton-text short" />
                <div className="skeleton skeleton-text short" style={{ width: '120px' }} />
              </div>
              <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="skeleton" style={{ height: '36px', borderRadius: '12px' }} />
                <div className="skeleton" style={{ height: '36px', borderRadius: '12px' }} />
              </div>
            </div>
          )) :
            filteredInstitutions.length > 0 ? filteredInstitutions.map(inst => (
              <InstitutionMiniCard
                key={inst.id}
                inst={inst}
                name={getInstitutionName(inst)}
                texts={texts}
              />
            )) :
            <div className="empty">{texts.noInstitutionsInCategory}</div>
          }
        </div>
      </section>

      {/* SECTION 5: Announcements Feed */}
      <section className="home-section-v2">
        <div className="section-header">
          <h2>{texts.announcements}</h2>
          <Link to="/search" className="view-link">{texts.viewMore} <FiChevronLeft /></Link>
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
                  <p>{getField(ann.institutions, 'name') || ann.institutions?.name_ar}</p>
                </div>
                {ann.registration_open && <span className="ann-badge">{texts.open}</span>}
              </div>
            ))
          }
        </div>
      </section>

      {/* SECTION 6: Recruitment Ads */}
      <section className="home-section-v2">
        <div className="section-header">
          <h2>{texts.educationJobs}</h2>
          <Link to="/recruitment" className="view-link">{texts.viewMore} <FiChevronLeft /></Link>
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
            recruitmentAds.length > 0 ? recruitmentAds.map(ad => (
              <div key={ad.id} className="ann-item-v2" onClick={() => setSelectedJobAd(ad)}>
                <div className="ann-dot" />
                <div className="ann-body" style={{ flex: 1 }}>
                  <h4>{locale === 'ar' ? ad.title_ar : (ad.title_fr || ad.title_ar)}</h4>
                  <p>{getField(ad.institutions, 'name') || ad.institutions?.name_ar}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span className="tag-outline">{ad.wilaya}</span>
                    <span className="tag-outline">{jobTypeLabel(ad.job_type)}</span>
                  </div>
                </div>
                <span className="ann-badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                  {new Date(ad.created_at).toLocaleDateString(dateLocale)}
                </span>
              </div>
            )) : (
              <div className="ann-item-v2">
                <div className="ann-body">
                  <h4>{texts.noJobs}</h4>
                  <p>{texts.jobsSoon}</p>
                </div>
              </div>
            )
          }
        </div>
      </section>

      {/* SECTION 7: Map CTA */}
      <div className="home-map-cta" onClick={() => navigate('/map')}>
        <div className="cta-content">
          <h3>{texts.exploreMap}</h3>
          <p>{texts.exploreMapDesc}</p>
        </div>
        <div className="cta-icon">
          <FiMap size={24} />
        </div>
      </div>

      {/* SEARCH MODAL OVERLAY */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Recruitment Ad Modal */}
      {selectedJobAd && (
        <div className="job-modal-overlay" onClick={() => setSelectedJobAd(null)}>
          <div className="job-modal" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="job-modal__header">
              <div>
                <h2>{locale === 'ar' ? selectedJobAd.title_ar : selectedJobAd.title_fr}</h2>
                <p className="job-meta">
                  <span><FiMapPin /> {selectedJobAd.wilaya}</span>
                  <span><FiBriefcase /> {jobTypeLabel(selectedJobAd.job_type)}</span>
                  <span>{new Date(selectedJobAd.created_at).toLocaleDateString(dateLocale)}</span>
                </p>
              </div>
              <button className="job-modal__close" onClick={() => setSelectedJobAd(null)}>×</button>
            </div>
            <div className="job-modal__body">
              <p>{locale === 'ar' ? selectedJobAd.description_ar : (selectedJobAd.description_fr || selectedJobAd.description_ar)}</p>
            </div>
            <div className="job-modal__footer">
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/institution/${selectedJobAd.institution_id}`)}>
                {texts.visitInstitution}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
