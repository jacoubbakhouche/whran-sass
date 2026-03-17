import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { FiCheck, FiLogOut, FiInfo, FiMapPin, FiPhone, FiGlobe, FiLayers } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { WILAYAS } from '../../../lib/mockData';
import './InstitutionOnboarding.css';

export default function InstitutionOnboarding({ onComplete }) {
    const { t, locale, dir } = useI18n();
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name_ar: '',
        name_fr: '',
        type: 'مدرسة',
        wilaya: '16',
        commune: '',
        address_detail: '',
        phone: '',
        description: '',
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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            // 1. Create/Update Institution Record as ACTIVE immediately
            const { data: inst, error: instError } = await supabase
                .from('institutions')
                .upsert({
                    owner_id: user.id,
                    name_ar: formData.name_ar,
                    name_fr: formData.name_fr,
                    type: formData.type,
                    wilaya: formData.wilaya,
                    commune: formData.commune,
                    address_detail: formData.address_detail,
                    phone: formData.phone,
                    description: formData.description,
                    lat: formData.lat ? parseFloat(formData.lat) : null,
                    lng: formData.lng ? parseFloat(formData.lng) : null,
                    status: 'active' // Instant activation
                }, { onConflict: 'owner_id' })
                .select()
                .single();

            if (instError) throw instError;

            // 2. Initialize minimal services record
            await supabase
                .from('institution_services')
                .upsert({
                    institution_id: inst.id,
                    is_enrollment_open: true
                }, { onConflict: 'institution_id' });

            // 3. Update Profile Flag
            await supabase
                .from('profiles')
                .update({ has_filled_form: true, status: 'active' })
                .eq('id', user.id);

            // Refresh auth context profile so UI (bottom nav) updates immediately
            await refreshProfile();

            if (onComplete) onComplete();
        } catch (err) {
            console.error('Onboarding Error:', err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-page" dir={dir}>
            <header className="onboarding-header">
                <div className="onboarding-brand">
                    <span>🏫</span>
                    <span>{t('appName')}</span>
                </div>
                <button className="btn-logout" onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/welcome');
                }}>
                    <FiLogOut style={{ marginLeft: locale === 'ar' ? '8px' : '0', marginRight: locale === 'fr' ? '8px' : '0' }} />
                    {t('logout')}
                </button>
            </header>

            <div className="onboarding-container">
                <div className="onboarding-wizard onboarding-wizard--simple animate-up">
                    <div className="onboarding-content">
                        <h1>{locale === 'ar' ? 'إعداد ملف المؤسسة' : 'Profil de l\'établissement'}</h1>
                        <p className="subtitle">{locale === 'ar' ? 'أدخل المعلومات الأساسية لتبدأ بنشر إعلاناتك' : 'Saisissez les informations de base pour commencer à publier'}</p>

                        <form className="simple-onboarding-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label><FiInfo /> {locale === 'ar' ? 'اسم المؤسسة (بالعربية)' : 'Nom (Arabe)'}</label>
                                    <input type="text" value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} placeholder="..." required />
                                </div>
                                <div className="form-group">
                                    <label><FiInfo /> {locale === 'ar' ? 'اسم المؤسسة (بالفرنسية)' : 'Nom (Français)'}</label>
                                    <input type="text" value={formData.name_fr} onChange={e => setFormData({...formData, name_fr: e.target.value})} placeholder="..." required />
                                </div>
                                <div className="form-group">
                                    <label><FiLayers /> {locale === 'ar' ? 'نوع المؤسسة' : 'Type'}</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                        <option value="مدرسة">{locale === 'ar' ? 'مدرسة' : 'École'}</option>
                                        <option value="ابتدائي">{locale === 'ar' ? 'ابتدائي' : 'Primaire'}</option>
                                        <option value="متوسط">{locale === 'ar' ? 'متوسط' : 'CEM'}</option>
                                        <option value="ثانوي">{locale === 'ar' ? 'ثانوي' : 'Lycée'}</option>
                                        <option value="جامعة">{locale === 'ar' ? 'جامعة' : 'Université'}</option>
                                        <option value="مركز تدريب">{locale === 'ar' ? 'مركز تدريب' : 'Centre de formation'}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label><FiPhone /> {locale === 'ar' ? 'رقم الهاتف' : 'Téléphone'}</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="..." />
                                </div>
                                <div className="form-group">
                                    <label><FiMapPin /> {locale === 'ar' ? 'الولاية' : 'Wilaya'}</label>
                                    <select value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})} required>
                                        {WILAYAS.map(w => (
                                            <option key={w.code} value={w.code}>
                                                {w.code} - {locale === 'ar' ? w.name_ar : w.name_fr}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label><FiMapPin /> {locale === 'ar' ? 'البلدية' : 'Commune'}</label>
                                    <input type="text" value={formData.commune} onChange={e => setFormData({...formData, commune: e.target.value})} placeholder="..." required />
                                </div>
                                <div className="form-group">
                                    <label><FiMapPin /> {locale === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}</label>
                                    <input type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} placeholder="36.1234" />
                                </div>
                                <div className="form-group">
                                    <label><FiMapPin /> {locale === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}</label>
                                    <input type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} placeholder="3.1234" />
                                </div>
                                <div className="form-group full-width" style={{ marginTop: '-10px' }}>
                                    <button 
                                        type="button" 
                                        className="btn-text-icon" 
                                        onClick={handleGetLocation}
                                        disabled={geolocating}
                                        style={{ fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' }}
                                    >
                                        <FiMapPin />
                                        {geolocating ? (locale === 'ar' ? 'جاري التحديد...' : 'Localisation...') : (locale === 'ar' ? 'تحديد موقعي الحالي (GPS)' : 'Ma position actuelle')}
                                    </button>
                                </div>
                                <div className="form-group full-width">
                                    <label><FiInfo /> {locale === 'ar' ? 'وصف مختصر' : 'Description courte'}</label>
                                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="..." rows="3" />
                                </div>
                            </div>

                            <div className="wizard-footer" style={{ border: 'none', padding: '0', marginTop: 'var(--space-6)' }}>
                                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                                    {loading ? '...' : (locale === 'ar' ? 'حفظ والبدء الآن' : 'Enregistrer and démarrer')}
                                    {!loading && <FiCheck style={{ marginRight: locale === 'ar' ? '8px' : '0', marginLeft: locale === 'fr' ? '8px' : '0' }} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
