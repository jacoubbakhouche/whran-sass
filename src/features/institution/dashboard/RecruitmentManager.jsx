import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { supabase } from '../../../lib/supabase';
import { FiPlus, FiTrash2, FiEdit2, FiBriefcase, FiMapPin, FiClock } from 'react-icons/fi';
import './RecruitmentManager.css';

const WILAYAS = [
    "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
    "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة",
    "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
    "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة",
    "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", "تيميمون", "برج باجي مختار",
    "أولاد جلال", "بني عباس", "إن صالح", "إن قزام", "تقرت", "جانت", "المغير", "المنيعة"
];

const JOB_TYPES = [
    { id: 'teacher', ar: 'أستاذ', fr: 'Enseignant' },
    { id: 'admin', ar: 'إداري', fr: 'Administrateur' },
    { id: 'counselor', ar: 'مستشار توجيه', fr: 'Conseiller' },
    { id: 'supervisor', ar: 'مشرف تربوي', fr: 'Surveillant' },
    { id: 'technician', ar: 'تقني', fr: 'Technicien' },
    { id: 'other', ar: 'آخر', fr: 'Autre' }
];

export default function RecruitmentManager() {
    const { locale, t, dir } = useI18n();
    const { institution } = useOutletContext();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [formData, setFormData] = useState({
        title_ar: '',
        title_fr: '',
        description_ar: '',
        description_fr: '',
        wilaya: institution?.wilaya || '',
        job_type: 'teacher',
        experience_level: ''
    });

    useEffect(() => {
        if (institution?.id) fetchAds();
    }, [institution?.id]);

    async function fetchAds() {
        try {
            const { data, error } = await supabase
                .from('recruitment_ads')
                .select('*')
                .eq('institution_id', institution.id)
                .order('created_at', { ascending: false });

            if (data) setAds(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            institution_id: institution.id,
            status: 'active'
        };

        try {
            if (editingAd) {
                const { error } = await supabase
                    .from('recruitment_ads')
                    .update(payload)
                    .eq('id', editingAd.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('recruitment_ads')
                    .insert([payload]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            setEditingAd(null);
            resetForm();
            fetchAds();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الإعلان؟' : 'Confirmer la suppression?')) return;
        try {
            await supabase.from('recruitment_ads').delete().eq('id', id);
            fetchAds();
        } catch (err) {
            console.error(err);
        }
    }

    function openEdit(ad) {
        setEditingAd(ad);
        setFormData({
            title_ar: ad.title_ar,
            title_fr: ad.title_fr,
            description_ar: ad.description_ar,
            description_fr: ad.description_fr,
            wilaya: ad.wilaya,
            job_type: ad.job_type,
            experience_level: ad.experience_level
        });
        setIsModalOpen(true);
    }

    function resetForm() {
        setFormData({
            title_ar: '',
            title_fr: '',
            description_ar: '',
            description_fr: '',
            wilaya: institution?.wilaya || '',
            job_type: 'teacher',
            experience_level: ''
        });
    }

    return (
        <div className="recruitment-manager" dir={dir}>
            <div className="manager-header">
                <div>
                    <h1>{locale === 'ar' ? 'إعلانات التوظيف' : 'Annonces de Recrutement'}</h1>
                    <p>{locale === 'ar' ? 'إدارة فرص العمل المتاحة في مؤسستك' : 'Gérez les opportunités d\'emploi dans votre établissement'}</p>
                </div>
                <button className="btn-add" onClick={() => { resetForm(); setEditingAd(null); setIsModalOpen(true); }}>
                    <FiPlus /> {locale === 'ar' ? 'إضافة إعلان' : 'Ajouter une annonce'}
                </button>
            </div>

            {loading && ads.length === 0 ? (
                <div className="loading-state">{t('loading')}</div>
            ) : ads.length === 0 ? (
                <div className="empty-state">
                    <FiBriefcase size={48} />
                    <h3>{locale === 'ar' ? 'لا توجد إعلانات نشطة' : 'Aucune annonce active'}</h3>
                    <p>{locale === 'ar' ? 'ابدأ بنشر أول إعلان توظيف لجذب الكفاءات' : 'Commencez par publier votre première annonce'}</p>
                </div>
            ) : (
                <div className="ads-grid">
                    {ads.map(ad => (
                        <div key={ad.id} className="ad-card">
                            <div className="ad-card-header">
                                <span className={`job-tag ${ad.job_type}`}>
                                    {JOB_TYPES.find(t => t.id === ad.job_type)?.[locale]}
                                </span>
                                <div className="ad-actions">
                                    <button onClick={() => openEdit(ad)} title={t('edit')}><FiEdit2 /></button>
                                    <button onClick={() => handleDelete(ad.id)} title={t('delete')} className="btn-delete"><FiTrash2 /></button>
                                </div>
                            </div>
                            <h3>{locale === 'ar' ? ad.title_ar : ad.title_fr}</h3>
                            <div className="ad-meta">
                                <span><FiMapPin /> {ad.wilaya}</span>
                                <span><FiClock /> {new Date(ad.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                            </div>
                            <p className="ad-preview">
                                {locale === 'ar' ? ad.description_ar : ad.description_fr}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingAd ? (locale === 'ar' ? 'تعديل الإعلان' : 'Modifier l\'annonce') : (locale === 'ar' ? 'إضافة إعلان جديد' : 'Nouvelle annonce')}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'العنوان (بالعربية)' : 'Titre (Arabe)'}</label>
                                    <input required value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'العنوان (بالفرنسية)' : 'Titre (Français)'}</label>
                                    <input required value={formData.title_fr} onChange={e => setFormData({...formData, title_fr: e.target.value})} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'الولاية' : 'Wilaya'}</label>
                                    <select value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                                        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'نوع الوظيفة' : 'Type de poste'}</label>
                                    <select value={formData.job_type} onChange={e => setFormData({...formData, job_type: e.target.value})}>
                                        {JOB_TYPES.map(jt => <option key={jt.id} value={jt.id}>{jt[locale]}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{locale === 'ar' ? 'الوصف والمتطلبات (بالعربية)' : 'Description & Exigences (Arabe)'}</label>
                                <textarea rows="4" value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>{locale === 'ar' ? 'الوصف والمتطلبات (بالفرنسية)' : 'Description & Exigences (Français)'}</label>
                                <textarea rows="4" value={formData.description_fr} onChange={e => setFormData({...formData, description_fr: e.target.value})} />
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">{t('cancel')}</button>
                                <button type="submit" className="btn-save" disabled={loading}>{t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
