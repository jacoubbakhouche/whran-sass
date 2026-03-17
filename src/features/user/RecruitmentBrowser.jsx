import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';
import { FiSearch, FiMapPin, FiBriefcase, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import './RecruitmentBrowser.css';

const WILAYAS = [
    "الكل", "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
    "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة",
    "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
    "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة",
    "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", "تيميمون", "برج باجي مختار",
    "أولاد جلال", "بني عباس", "إن صالح", "إن قزام", "تقرت", "جانت", "المغير", "المنيعة"
];

const JOB_TYPES = [
    { id: 'all', ar: 'الكل', fr: 'Tous' },
    { id: 'teacher', ar: 'أستاذ', fr: 'Enseignant' },
    { id: 'admin', ar: 'إداري', fr: 'Administrateur' },
    { id: 'other', ar: 'آخر', fr: 'Autre' }
];

export default function RecruitmentBrowser() {
    const { locale, t, dir } = useI18n();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedWilaya, setSelectedWilaya] = useState('الكل');
    const [selectedType, setSelectedType] = useState('all');

    useEffect(() => {
        fetchAds();
    }, [selectedWilaya, selectedType]);

    async function fetchAds() {
        setLoading(true);
        try {
            let query = supabase
                .from('recruitment_ads')
                .select('*, institutions(name_ar, name_fr, logo_url)')
                .eq('status', 'active');

            if (selectedWilaya !== 'الكل') {
                query = query.eq('wilaya', selectedWilaya);
            }
            if (selectedType !== 'all') {
                query = query.eq('job_type', selectedType);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (data) setAds(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredAds = ads.filter(ad => {
        const title = (locale === 'ar' ? ad.title_ar : ad.title_fr).toLowerCase();
        return title.includes(search.toLowerCase());
    });

    return (
        <div className="recruitment-browser" dir={dir}>
            <div className="browser-hero">
                <h1>{locale === 'ar' ? 'فرص التوظيف' : 'Opportunités de recrutement'}</h1>
                <p>{locale === 'ar' ? 'ابحث عن وظيفتك القادمة في قطاع التعليم' : 'Trouvez votre prochain emploi dans le secteur de l\'éducation'}</p>
                
                <div className="search-bar">
                    <FiSearch />
                    <input 
                        placeholder={locale === 'ar' ? 'ابحث عن مسمى وظيفي...' : 'Rechercher un poste...'} 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="browser-layout">
                <aside className="filters-sidebar">
                    <h3>{t('filters')}</h3>
                    
                    <div className="filter-group">
                        <label>{locale === 'ar' ? 'الولاية' : 'Wilaya'}</label>
                        <select value={selectedWilaya} onChange={e => setSelectedWilaya(e.target.value)}>
                            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>{locale === 'ar' ? 'نوع الوظيفة' : 'Type de poste'}</label>
                        <div className="type-chips">
                            {JOB_TYPES.map(jt => (
                                <button 
                                    key={jt.id} 
                                    className={selectedType === jt.id ? 'active' : ''}
                                    onClick={() => setSelectedType(jt.id)}
                                >
                                    {jt[locale]}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="results-main">
                    {loading ? (
                        <div className="loading-grid">
                            {[1, 2, 3].map(i => <div key={i} className="skeleton-ad" />)}
                        </div>
                    ) : filteredAds.length === 0 ? (
                        <div className="no-ads">
                            <FiBriefcase size={64} />
                            <h3>{t('noResults')}</h3>
                            <p>{t('noResultsDescription')}</p>
                        </div>
                    ) : (
                        <div className="ads-list">
                            {filteredAds.map(ad => (
                                <div key={ad.id} className="public-ad-card">
                                    <div className="ad-main-info">
                                        <div className="inst-mini-info">
                                            <img 
                                                src={ad.institutions?.logo_url || `https://ui-avatars.com/api/?name=${ad.institutions?.name_ar}&background=random`} 
                                                alt="logo" 
                                            />
                                            <div>
                                                <h4>{locale === 'ar' ? ad.institutions?.name_ar : ad.institutions?.name_fr}</h4>
                                                <span><FiMapPin /> {ad.wilaya}</span>
                                            </div>
                                        </div>
                                        <h3>{locale === 'ar' ? ad.title_ar : ad.title_fr}</h3>
                                        <p>{locale === 'ar' ? ad.description_ar : ad.description_fr}</p>
                                    </div>
                                    <div className="ad-footer">
                                        <span className="post-date">{new Date(ad.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                                        <button className="btn-contact">
                                            {locale === 'ar' ? 'عرض مسمى الوظيفة' : 'Détails du poste'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
