import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { FiArrowRight, FiArrowLeft, FiCheck, FiUpload, FiMapPin, FiInfo, FiLayers, FiLogOut } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import './InstitutionOnboarding.css';

export default function InstitutionOnboarding({ onComplete, status, rejectionReason }) {
    const { t, locale, dir } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name_ar: '',
        name_fr: '',
        type: 'school',
        wilaya: '',
        commune: '',
        address_detail: '',
        phone: '',
        email: '',
        website: '',
        founded_year: '',
        is_private: true,
        description: '',
        logo_url: '',
        cover_url: '',
        programs: '',
        fee_min: '',
        fee_max: '',
        has_transport: false,
        has_canteen: false,
        is_open: true
    });

    const steps = [
        { id: 1, title: locale === 'ar' ? 'المعلومات الأساسية' : 'Infos de Base', icon: <FiInfo /> },
        { id: 2, title: locale === 'ar' ? 'الوثائق والصور' : 'Docs & Images', icon: <FiUpload /> },
        { id: 3, title: locale === 'ar' ? 'الخدمات والبرامج' : 'Services & Progs', icon: <FiLayers /> }
    ];

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async (isFinal = true) => {
        setLoading(true);
        try {
            const status = isFinal ? 'pending' : 'draft';
            
            // 1. Create/Update Institution Record
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
                    email: formData.email,
                    website: formData.website,
                    founded_year: parseInt(formData.founded_year) || null,
                    is_private: formData.is_private,
                    description: formData.description,
                    logo_url: formData.logo_url,
                    cover_url: formData.cover_url,
                    status: status
                }, { onConflict: 'owner_id' })
                .select()
                .single();

            if (instError) throw instError;

            // 2. Handle Services
            const { error: servError } = await supabase
                .from('institution_services')
                .upsert({
                    institution_id: inst.id,
                    programs: formData.programs,
                    fee_range: `${formData.fee_min} - ${formData.fee_max}`,
                    has_transport: formData.has_transport,
                    has_canteen: formData.has_canteen,
                    is_enrollment_open: formData.is_open
                });

            if (servError) throw servError;

            // 3. Update Profile Flag
            if (isFinal) {
                await supabase
                    .from('profiles')
                    .update({ has_filled_form: true, status: 'submitted' })
                    .eq('id', user.id);

                await supabase.from('notifications').insert({
                    user_id: null, // Global/System notification for admins
                    type: 'admin_review',
                    title_ar: 'طلب تسجيل مؤسسة جديدة',
                    title_fr: 'Nouvelle demande d\'inscription',
                    content_ar: `المؤسسة ${formData.name_ar} بانتظار المراجعة.`,
                    content_fr: `L'établissement ${formData.name_fr} est en attente de révision.`,
                    related_id: inst.id
                });
            }

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
                <h1 className="animate-up">{locale === 'ar' ? 'أكمل ملف مؤسستك' : 'Complétez votre profil'}</h1>
                <p className="subtitle animate-up">{locale === 'ar' ? 'يرجى تزويدنا بالمعلومات اللازمة لمراجعة طلب انضمامك.' : 'Veuillez nous fournir les informations nécessaires pour examiner votre demande.'}</p>

                <div className="onboarding-wizard">
                    {status === 'info_requested' && (
                        <div className="info-requested-msg animate-up" style={{
                            margin: 'var(--space-6) var(--space-6) 0',
                            padding: 'var(--space-4)',
                            background: '#FFF4E4',
                            border: '1px solid var(--warning)',
                            borderRadius: 'var(--radius-md)',
                            color: '#B45309'
                        }}>
                            <strong style={{ display: 'block', marginBottom: '4px' }}>⚠️ {locale === 'ar' ? 'طلب من الإدارة (تحديث البيانات):' : 'Note de l\'admin (mise à jour):'}</strong>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>{rejectionReason}</p>
                        </div>
                    )}
                    <div className="wizard-header">
                        <div className="wizard-steps">
                            {steps.map(s => (
                                <div key={s.id} className={`step-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
                                    <div className="step-icon">
                                        {step > s.id ? <FiCheck /> : s.icon}
                                    </div>
                                    <span>{s.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="wizard-body animate-up">
                        {step === 1 && (
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'اسم المؤسسة (بالعربية)' : 'Nom (Arabe)'}</label>
                                    <input type="text" value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} placeholder="..." />
                                </div>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'اسم المؤسسة (بالفرنسية)' : 'Nom (Français)'}</label>
                                    <input type="text" value={formData.name_fr} onChange={e => setFormData({...formData, name_fr: e.target.value})} placeholder="..." />
                                </div>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'نوع المؤسسة' : 'Type'}</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                        <option value="nursery">{locale === 'ar' ? 'حضانة' : 'Crèche'}</option>
                                        <option value="primary">{locale === 'ar' ? 'ابتدائي' : 'Primaire'}</option>
                                        <option value="middle">{locale === 'ar' ? 'متوسط' : 'CEM'}</option>
                                        <option value="secondary">{locale === 'ar' ? 'ثانوي' : 'Lycée'}</option>
                                        <option value="university">{locale === 'ar' ? 'جامعة' : 'Université'}</option>
                                        <option value="training">{locale === 'ar' ? 'مركز تدريب' : 'Centre de formation'}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'الولاية' : 'Wilaya'}</label>
                                    <input type="text" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})} placeholder="الجزائر" />
                                </div>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'البلدية' : 'Commune'}</label>
                                    <input type="text" value={formData.commune} onChange={e => setFormData({...formData, commune: e.target.value})} placeholder="الأبيار" />
                                </div>
                                <div className="form-group full-width">
                                    <label>{locale === 'ar' ? 'العنوان التفصيلي' : 'Adresse détaillée'}</label>
                                    <textarea value={formData.address_detail} onChange={e => setFormData({...formData, address_detail: e.target.value})} placeholder="..." rows="3" />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="upload-section">
                                <p style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{locale === 'ar' ? 'يرجى رفع الوثائق الرسمية وشعار المؤسسة.' : 'Veuillez télécharger les documents officiels et le logo.'}</p>
                                <div className="upload-grid">
                                    <div className="upload-card">
                                        <FiUpload size={32} color="var(--primary)" />
                                        <span>{locale === 'ar' ? 'سجل تجاري / اعتماد' : 'Registre du commerce'}</span>
                                        <input type="file" />
                                    </div>
                                    <div className="upload-card">
                                        <FiUpload size={32} color="var(--primary)" />
                                        <span>{locale === 'ar' ? 'شعار المؤسسة' : 'Logo'}</span>
                                        <input type="file" />
                                    </div>
                                </div>
                                <div className="form-group full-width" style={{ marginTop: '2.5rem' }}>
                                    <label>{locale === 'ar' ? 'وصف المؤسسة' : 'Description'}</label>
                                    <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="..." />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="services-section">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>{locale === 'ar' ? 'البرامج المتاحة' : 'Programmes'}</label>
                                        <input type="text" value={formData.programs} onChange={e => setFormData({...formData, programs: e.target.value})} placeholder="لغات، علوم ، تقني ..." />
                                    </div>
                                    <div className="form-group">
                                        <label>{locale === 'ar' ? 'أقل سعر سنوي' : 'Tarif min'}</label>
                                        <input type="number" value={formData.fee_min} onChange={e => setFormData({...formData, fee_min: e.target.value})} placeholder="DA" />
                                    </div>
                                    <div className="form-group">
                                        <label>{locale === 'ar' ? 'أقصى سعر سنوي' : 'Tarif max'}</label>
                                        <input type="number" value={formData.fee_max} onChange={e => setFormData({...formData, fee_max: e.target.value})} placeholder="DA" />
                                    </div>
                                </div>
                                <div className="checkbox-grid">
                                    <label className="checkbox-item">
                                        <input type="checkbox" checked={formData.has_transport} onChange={e => setFormData({...formData, has_transport: e.target.checked})} />
                                        <span>{locale === 'ar' ? 'نقل مدرسي' : 'Transport scolaire'}</span>
                                    </label>
                                    <label className="checkbox-item">
                                        <input type="checkbox" checked={formData.has_canteen} onChange={e => setFormData({...formData, has_canteen: e.target.checked})} />
                                        <span>{locale === 'ar' ? 'مطعم' : 'Cantine'}</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="wizard-footer">
                        {step > 1 ? (
                            <button className="btn-secondary" onClick={handleBack} disabled={loading}>
                                <FiArrowRight style={{ marginLeft: locale === 'ar' ? '8px' : '0', marginRight: locale === 'fr' ? '8px' : '0' }} />
                                <span>{locale === 'ar' ? 'السابق' : 'Précédent'}</span>
                            </button>
                        ) : <div style={{ flex: 1 }} />}
                        
                        <div style={{ flex: 1 }} />
                        
                        <button 
                            className="btn-draft" 
                            onClick={() => handleSubmit(false)} 
                            disabled={loading}
                        >
                            {locale === 'ar' ? 'حفظ مسودة' : 'Sauvegarder'}
                        </button>

                        {step < 3 ? (
                            <button className="btn-primary" onClick={handleNext}>
                                <span>{locale === 'ar' ? 'التالي' : 'Suivant'}</span>
                                {locale === 'ar' ? <FiArrowLeft style={{ marginRight: '8px' }} /> : <FiArrowRight style={{ marginLeft: '8px' }} />}
                            </button>
                        ) : (
                            <button className="btn-primary" onClick={() => handleSubmit(true)} disabled={loading}>
                                {loading ? '...' : (locale === 'ar' ? 'إرسال الطلب مراجعة' : 'Soumettre')}
                                <FiCheck style={{ marginRight: locale === 'ar' ? '8px' : '0', marginLeft: locale === 'fr' ? '8px' : '3' }} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
