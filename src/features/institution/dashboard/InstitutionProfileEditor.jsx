import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { FiCamera, FiSave, FiMapPin, FiPhone, FiMail, FiGlobe } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import './InstitutionProfileEditor.css';

export default function InstitutionProfileEditor() {
    const { t, locale, dir } = useI18n();
    const { institution } = useOutletContext();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const [formData, setFormData] = useState({
        name_ar: '',
        name_fr: '',
        description: '', 
        phone: '',
        email: '',
        website: '',
        address_detail: '', 
        wilaya: '', 
        commune: '',
        type: 'school', 
        founded_year: '',
        is_private: false,
        programs: '',
        fee_min: '',
        fee_max: '',
        has_transport: false,
        has_canteen: false,
        is_enrollment_open: true,
        logo_url: '',
        cover_url: '',
        lat: '',
        lng: '',
    });

    const [geolocating, setGeolocating] = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert(locale === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Géolocalisation non supportée');
            return;
        }

        setGeolocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    lat: position.coords.latitude.toFixed(6),
                    lng: position.coords.longitude.toFixed(6)
                }));
                setGeolocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert(locale === 'ar' ? 'فشل جلب الموقع' : 'Échec de la localisation');
                setGeolocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const [uploading, setUploading] = useState({ logo: false, cover: false });

    useEffect(() => {
        const fetchDeepData = async () => {
            if (!institution) return;
            
            // 1. Set basic info from props
            const basicInfo = {
                name_ar: institution.name_ar || '',
                name_fr: institution.name_fr || '',
                description: institution.description || '',
                phone: institution.phone || '',
                email: institution.email || '',
                website: institution.website || '',
                address_detail: institution.address_detail || '',
                wilaya: institution.wilaya || '',
                commune: institution.commune || '',
                type: institution.type || 'school',
                founded_year: institution.founded_year || '',
                is_private: institution.is_private || false,
                logo_url: institution.logo_url || '',
                cover_url: institution.cover_url || '',
                lat: institution.lat || '',
                lng: institution.lng || '',
            };

            // 2. Fetch services separately
            const { data: services } = await supabase
                .from('institution_services')
                .select('*')
                .eq('institution_id', institution.id)
                .maybeSingle();

            if (services) {
                const [min, max] = (services.fee_range || '0 - 0').split(' - ');
                setFormData({
                    ...basicInfo,
                    programs: services.programs || '',
                    fee_min: min || '',
                    fee_max: max || '',
                    has_transport: services.has_transport || false,
                    has_canteen: services.has_canteen || false,
                    is_enrollment_open: services.is_enrollment_open ?? true,
                });
            } else {
                setFormData(prev => ({ ...prev, ...basicInfo }));
            }
        };

        fetchDeepData();
    }, [institution]);

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file || !institution) return;

        setUploading(prev => ({ ...prev, [type]: true }));
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${institution.id}/${type}_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, [`${type}_url`]: publicUrl }));
        } catch (err) {
            console.error('Error uploading image:', err);
            alert(locale === 'ar' ? 'فشل تحميل الصورة' : 'Échec du téléchargement');
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    const { user } = useAuth();

    const [saveStatus, setSaveStatus] = useState('idle'); // idle, success, error

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!user) {
            alert(locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Veuillez vous connecter');
            return;
        }
        if (!institution) {
            alert(locale === 'ar' ? 'بيانات المؤسسة غير مكتملة' : 'Données institutionnelles incomplètes');
            return;
        }
        setLoading(true);
        setSaveStatus('idle');
        
        try {
            // Step 1: Update main institution record
            const instData = {
                id: institution.id,
                owner_id: user.id,
                name_ar: formData.name_ar,
                name_fr: formData.name_fr,
                description: formData.description,
                phone: formData.phone,
                email: formData.email,
                website: formData.website,
                address_detail: formData.address_detail,
                wilaya: formData.wilaya,
                commune: formData.commune,
                type: formData.type,
                founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
                is_private: formData.is_private,
                logo_url: formData.logo_url,
                cover_url: formData.cover_url,
                lat: formData.lat ? parseFloat(formData.lat) : null,
                lng: formData.lng ? parseFloat(formData.lng) : null,
            };

            const { error: instError } = await supabase
                .from('institutions')
                .upsert(instData, { onConflict: 'owner_id' });
            
            if (instError) throw instError;

            // Step 2: Update services
            const servicesData = {
                institution_id: institution.id,
                programs: formData.programs,
                fee_range: `${formData.fee_min || 0} - ${formData.fee_max || 0}`,
                has_transport: formData.has_transport,
                has_canteen: formData.has_canteen,
                is_enrollment_open: formData.is_enrollment_open
            };

            const { error: servError } = await supabase
                .from('institution_services')
                .upsert(servicesData, { onConflict: 'institution_id' });
            
            if (servError) throw servError;

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('Error saving profile:', err);
            setSaveStatus('error');
            alert(locale === 'ar' ? 'خطأ في الحفظ: ' + (err.message || '') : 'Erreur d\'enregistrement: ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const stepInfo = [
        { title: locale === 'ar' ? 'الوسائط' : 'Médias', icon: '📸' },
        { title: locale === 'ar' ? 'المعلومات' : 'Infos', icon: '📝' },
        { title: locale === 'ar' ? 'الخدمات' : 'Services', icon: '✨' },
        { title: locale === 'ar' ? 'الاتصال' : 'Contact', icon: '📞' },
    ];

    return (
        <div className="profile-editor animate-up">
            <div className="profile-editor__header">
                <h1>{locale === 'ar' ? 'تعديل ملف المؤسسة' : 'Éditer le profil'}</h1>
                <p>{locale === 'ar' ? 'أكمل خطوات تحديث بيانات ملفك الشخصي' : 'Complétez les étapes pour mettre à jour votre profil'}</p>
                
                {/* Progress Indicator */}
                <div className="wizard-progress">
                    <div className="wizard-progress__bar">
                        <div className="wizard-progress__fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
                    </div>
                    <div className="wizard-progress__steps">
                        {stepInfo.map((step, idx) => (
                            <div key={idx} className={`wizard-step-node ${currentStep > idx + 1 ? 'completed' : ''} ${currentStep === idx + 1 ? 'active' : ''}`}>
                                <div className="wizard-step-node__circle">
                                    {currentStep > idx + 1 ? '✓' : step.icon}
                                </div>
                                <span className="wizard-step-node__label">{step.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <form className="profile-editor__form" onSubmit={handleSubmit}>
                {/* ─── Step 1: Media ─── */}
                {currentStep === 1 && (
                    <div className="form-section wizard-animate-in">
                        <h3><FiCamera /> {locale === 'ar' ? 'الصور والوسائط' : 'Photos & Médias'}</h3>
                        <div className="image-grid">
                            <label className={`image-upload-card logo-upload ${uploading.logo ? 'uploading' : ''}`}>
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} hidden />
                                {formData.logo_url ? (
                                    <img src={formData.logo_url} alt="Logo" className="preview-image" />
                                ) : (
                                    <>
                                        <FiCamera />
                                        <span>{locale === 'ar' ? 'شعار المؤسسة' : 'Logo'}</span>
                                    </>
                                )}
                                <div className="badge">{uploading.logo ? '...' : (locale === 'ar' ? 'تغيير' : 'Changer')}</div>
                            </label>
                            
                            <label className={`image-upload-card cover-upload ${uploading.cover ? 'uploading' : ''}`}>
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} hidden />
                                {formData.cover_url ? (
                                    <img src={formData.cover_url} alt="Cover" className="preview-image" />
                                ) : (
                                    <>
                                        <FiCamera />
                                        <span>{locale === 'ar' ? 'صورة الغلاف' : 'Couverture'}</span>
                                    </>
                                )}
                                <div className="badge">{uploading.cover ? '...' : (locale === 'ar' ? 'تغيير' : 'Changer')}</div>
                            </label>
                        </div>
                    </div>
                )}

                {/* ─── Step 2: Basic Info ─── */}
                {currentStep === 2 && (
                    <div className="form-section wizard-animate-in">
                        <h3><FiSave /> {locale === 'ar' ? 'المعلومات الأساسية' : 'Informations de base'}</h3>
                        <div className="input-grid">
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'الاسم (العربية)' : 'Nom (Arabe)'}</label>
                                <input value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} placeholder="..." />
                            </div>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'الاسم (الفرنسية)' : 'Nom (Français)'}</label>
                                <input value={formData.name_fr} onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })} placeholder="..." />
                            </div>
                        </div>
                        
                        <div className="input-grid">
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'نوع المؤسسة' : 'Type'}</label>
                                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="school">{locale === 'ar' ? 'مدرسة' : 'École'}</option>
                                    <option value="primary">{locale === 'ar' ? 'ابتدائي' : 'Primaire'}</option>
                                    <option value="middle">{locale === 'ar' ? 'متوسط' : 'Moyen'}</option>
                                    <option value="secondary">{locale === 'ar' ? 'ثانوي' : 'Secondaire'}</option>
                                    <option value="university">{locale === 'ar' ? 'جامعة' : 'Université'}</option>
                                    <option value="training">{locale === 'ar' ? 'مركز تدريب' : 'Centre de formation'}</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'سنة التأسيس' : 'Année de fondation'}</label>
                                <input type="number" value={formData.founded_year} onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })} placeholder="Ex: 1990" />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>{locale === 'ar' ? 'الوصف والنبذة' : 'Description & Bio'}</label>
                            <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="..." />
                        </div>

                        <div className="checkbox-group">
                            <label><input type="checkbox" checked={formData.is_private} onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })} /> {locale === 'ar' ? 'مؤسسة خاصة' : 'Établissement privé'}</label>
                        </div>
                    </div>
                )}

                {/* ─── Step 3: Services & Fees ─── */}
                {currentStep === 3 && (
                    <div className="form-section wizard-animate-in">
                        <h3><FiSave /> {locale === 'ar' ? 'الخدمات والرسوم' : 'Services & Frais'}</h3>
                        <div className="input-group">
                            <label>{locale === 'ar' ? 'البرامج والتخصصات المتاحة' : 'Programmes et spécialités'}</label>
                            <input value={formData.programs} onChange={(e) => setFormData({ ...formData, programs: e.target.value })} placeholder="Ex: Informatique, Management..." />
                        </div>

                        <div className="input-grid" style={{ marginTop: '16px' }}>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'الرسوم السنوية (الأدنى)' : 'Frais min (DA)'}</label>
                                <input type="number" value={formData.fee_min} onChange={(e) => setFormData({ ...formData, fee_min: e.target.value })} placeholder="0" />
                            </div>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'الرسوم السنوية (الأقصى)' : 'Frais max (DA)'}</label>
                                <input type="number" value={formData.fee_max} onChange={(e) => setFormData({ ...formData, fee_max: e.target.value })} placeholder="0" />
                            </div>
                        </div>

                        <div className="checkbox-group">
                            <label><input type="checkbox" checked={formData.has_transport} onChange={(e) => setFormData({ ...formData, has_transport: e.target.checked })} /> {locale === 'ar' ? 'نقل مدرسي' : 'Transport scolaire'}</label>
                            <label><input type="checkbox" checked={formData.has_canteen} onChange={(e) => setFormData({ ...formData, has_canteen: e.target.checked })} /> {locale === 'ar' ? 'مطعم / إطعام' : 'Cantine / Restauration'}</label>
                            <label><input type="checkbox" checked={formData.is_enrollment_open} onChange={(e) => setFormData({ ...formData, is_enrollment_open: e.target.checked })} /> {locale === 'ar' ? 'التسجيلات مفتوحة حالياً' : 'Inscriptions ouvertes'}</label>
                        </div>
                    </div>
                )}

                {/* ─── Step 4: Contact Info ─── */}
                {currentStep === 4 && (
                    <div className="form-section wizard-animate-in">
                        <h3><FiPhone /> {locale === 'ar' ? 'الموقع ومعلومات الاتصال' : 'Localisation & Contacts'}</h3>
                        <div className="input-grid">
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'الولاية' : 'Wilaya'}</label>
                                <input value={formData.wilaya} onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })} placeholder="..." />
                            </div>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'البلدية' : 'Commune'}</label>
                                <input value={formData.commune} onChange={(e) => setFormData({ ...formData, commune: e.target.value })} placeholder="..." />
                            </div>
                        </div>

                        <div className="input-grid">
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}</label>
                                <input type="number" step="any" value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} placeholder="36.1234" />
                            </div>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                                <input type="number" step="any" value={formData.lng} onChange={(e) => setFormData({ ...formData, lng: e.target.value })} placeholder="3.1234" />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: '16px' }}>
                            <button 
                                type="button" 
                                className="btn-text-icon" 
                                onClick={handleGetLocation}
                                disabled={geolocating}
                                style={{ 
                                    fontSize: '0.95rem', 
                                    color: 'var(--primary)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    background: 'var(--bg-main)', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    padding: '12px 18px',
                                    borderRadius: 'var(--radius-md)',
                                    width: 'fit-content'
                                }}
                            >
                                <FiMapPin />
                                {geolocating ? (locale === 'ar' ? 'جاري التحديد...' : 'Localisation...') : (locale === 'ar' ? 'تحديد موقعي الحالي (GPS)' : 'Ma position actuelle')}
                            </button>
                        </div>
                        
                        <div className="input-group with-icon" style={{ marginBottom: '16px' }}>
                            <FiMapPin />
                            <input value={formData.address_detail} placeholder={locale === 'ar' ? 'العنوان التفصيلي (الشارع، الحي...)' : 'Adresse détaillée (Rue, Quartier...)'} onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })} />
                        </div>

                        <div className="input-grid">
                            <div className="input-group with-icon">
                                <FiPhone />
                                <input value={formData.phone} placeholder={t('phone')} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="input-group with-icon">
                                <FiMail />
                                <input value={formData.email} placeholder={t('email')} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>
                        
                        <div className="input-group with-icon">
                            <FiGlobe />
                            <input value={formData.website} placeholder="www.website.com" onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                        </div>
                    </div>
                )}

                {/* Wizard Controls */}
                <div className="form-actions wizard-controls">
                    {currentStep > 1 && (
                        <button type="button" className="btn-back" onClick={prevStep} disabled={loading}>
                            {locale === 'ar' ? 'السابق' : 'Précédent'}
                        </button>
                    )}

                    <div style={{ flex: 1 }}></div>

                    {currentStep < totalSteps ? (
                        <button type="button" className="btn-next" onClick={nextStep} disabled={loading}>
                            {locale === 'ar' ? 'التالي' : 'Suivant'}
                        </button>
                    ) : (
                        <div className="save-container">
                            {saveStatus === 'success' && (
                                <div className="save-message success animate-fade-in" style={{ 
                                    color: '#28a745', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    marginBottom: '10px',
                                    fontWeight: '600'
                                }}>
                                    <span>✅</span>
                                    <span>{locale === 'ar' ? 'تم حفظ التغييرات بنجاح!' : 'Modifications enregistrées !'}</span>
                                </div>
                            )}
                            <button type="submit" className={`btn-save ${saveStatus === 'success' ? 'btn-save--success' : ''}`} disabled={loading}>
                                <FiSave />
                                <span>{loading ? (locale === 'ar' ? 'جاري الحفظ...' : 'Enregistrement...') : (locale === 'ar' ? 'حفظ التغييرات' : 'Sauvegarder')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
