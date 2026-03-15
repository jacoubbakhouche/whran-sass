import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { FiCamera, FiSave, FiUser, FiInfo, FiMapPin, FiPhone } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './StoreProfileEditor.css';

export default function StoreProfileEditor() {
    const { t, locale, dir } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');
    
    const [formData, setFormData] = useState({
        full_name: '',
        store_name: '',
        bio: '',
        phone: '',
        wilaya: '',
        commune: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (error) throw error;
            
            setFormData({
                full_name: data.full_name || '',
                store_name: data.store_name || '',
                bio: data.bio || '',
                phone: data.phone || '',
                wilaya: data.wilaya || '',
                commune: data.commune || '',
                avatar_url: data.avatar_url || ''
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/avatar_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (err) {
            console.error('Error uploading image:', err);
            alert(locale === 'ar' ? 'فشل تحميل الصورة' : 'Échec du téléchargement');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        
        setLoading(true);
        setSaveStatus('idle');
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    store_name: formData.store_name,
                    bio: formData.bio,
                    phone: formData.phone,
                    wilaya: formData.wilaya,
                    commune: formData.commune,
                    avatar_url: formData.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (error) throw error;

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('Error saving profile:', err);
            setSaveStatus('error');
            const msg = err.message || (locale === 'ar' ? 'خطأ غير معروف' : 'Erreur inconnue');
            alert((locale === 'ar' ? 'خطأ في الحفظ: ' : 'Erreur d\'enregistrement: ') + msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="store-profile-editor animate-up">
            <div className="spe-header">
                <h1>{locale === 'ar' ? 'الملف الشخصي للمتجر' : 'Profil du magasin'}</h1>
                <p>{locale === 'ar' ? 'أضف لمستك الشخصية ليثق الزبائن في متجرك' : 'Personnalisez votre boutique pour gagner la confiance des clients'}</p>
            </div>

            <form className="spe-form" onSubmit={handleSubmit}>
                <div className="spe-media">
                    <div className="avatar-section">
                        <div className={`avatar-container ${uploading ? 'uploading' : ''}`}>
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Store" className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder">
                                    <FiUser size={40} />
                                </div>
                            )}
                            <label className="avatar-edit-overlay">
                                <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
                                <FiCamera />
                            </label>
                        </div>
                        <div className="avatar-info">
                            <h3>{locale === 'ar' ? 'شعار المتجر' : 'Logo du magasin'}</h3>
                            <p>{locale === 'ar' ? 'يفضل استخدام صورة مربعة بجودة عالية' : 'Utilisez une image carrée de haute qualité'}</p>
                        </div>
                    </div>
                </div>

                <div className="spe-grid">
                    <div className="spe-input-group">
                        <label><FiUser /> {locale === 'ar' ? 'اسم المتجر (الاحترافي)' : 'Nom du magasin'}</label>
                        <input 
                            value={formData.store_name} 
                            onChange={(e) => setFormData({ ...formData, store_name: e.target.value })} 
                            placeholder={locale === 'ar' ? 'مثال: مكتبة النور للمواد التعليمية' : 'Ex: Librairie Al-Noor'}
                            required
                        />
                    </div>

                    <div className="spe-input-group">
                        <label><FiUser /> {locale === 'ar' ? 'الاسم الكامل للتاجر' : 'Nom complet du vendeur'}</label>
                        <input 
                            value={formData.full_name} 
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                            placeholder="..."
                        />
                    </div>

                    <div className="spe-input-group spe-full">
                        <label><FiInfo /> {locale === 'ar' ? 'نبذة عن المتجر' : 'À propos du magasin'}</label>
                        <textarea 
                            rows={4} 
                            value={formData.bio} 
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                            placeholder={locale === 'ar' ? 'أخبر الزبائن عما يميز متجرك وخدماتك...' : 'Parlez de votre boutique...'}
                        />
                    </div>

                    <div className="spe-input-group">
                        <label><FiPhone /> {locale === 'ar' ? 'رقم الهاتف' : 'Numéro de téléphone'}</label>
                        <input 
                            value={formData.phone} 
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                            placeholder="..."
                        />
                    </div>

                    <div className="spe-input-group">
                        <label><FiMapPin /> {locale === 'ar' ? 'الولاية' : 'Wilaya'}</label>
                        <input 
                            value={formData.wilaya} 
                            onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })} 
                            placeholder="..."
                        />
                    </div>
                </div>

                <div className="spe-actions">
                    {saveStatus === 'success' && (
                        <div className="spe-save-msg success">✨ {locale === 'ar' ? 'تم الحفظ!' : 'Enregistré!'}</div>
                    )}
                    <button type="submit" className={`spe-btn-save ${saveStatus === 'success' ? 'success' : ''}`} disabled={loading || uploading}>
                        <FiSave />
                        <span>{loading ? (locale === 'ar' ? 'جاري الحفظ...' : 'Sauvegarde...') : (locale === 'ar' ? 'حفظ البيانات' : 'Sauvegarder')}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
