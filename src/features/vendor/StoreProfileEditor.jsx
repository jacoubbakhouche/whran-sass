import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { FiCamera, FiSave, FiUser, FiInfo, FiMapPin, FiPhone } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import './StoreProfileEditor.css';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] && center[1]) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

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
        avatar_url: '',
        lat: '',
        lng: ''
    });

    const [geolocating, setGeolocating] = useState(false);

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
                avatar_url: data.avatar_url || '',
                lat: data.lat || '',
                lng: data.lng || ''
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

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
                    lat: parseFloat(position.coords.latitude).toFixed(6),
                    lng: parseFloat(position.coords.longitude).toFixed(6)
                }));
                setGeolocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let msg = locale === 'ar' ? 'فشل جلب الموقع' : 'Échec de la localisation';
                if (error.code === 1) msg = locale === 'ar' ? 'يرجى السماح للمتصفح بالوصول إلى موقعك' : 'Veuillez autoriser l\'accès à votre position';
                else if (error.code === 2) msg = locale === 'ar' ? 'الموقع غير متاح حالياً، تأكد من تفعيل الـ GPS في جهازك' : 'Position non disponible, vérifiez votre GPS';
                else if (error.code === 3) msg = locale === 'ar' ? 'انتهت مهلة تحديد الموقع، حاول مجدداً' : 'Délai d’attente dépassé, réessayez';
                
                alert(msg);
                setGeolocating(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
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
                    lat: formData.lat ? parseFloat(formData.lat) : null,
                    lng: formData.lng ? parseFloat(formData.lng) : null,
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

                    <div className="spe-input-group">
                        <label>Latitude</label>
                        <input 
                            type="number" step="any"
                            value={formData.lat} 
                            onChange={(e) => setFormData({ ...formData, lat: e.target.value })} 
                            placeholder="36.1234"
                        />
                    </div>

                    <div className="spe-input-group">
                        <label>Longitude</label>
                        <input 
                            type="number" step="any"
                            value={formData.lng} 
                            onChange={(e) => setFormData({ ...formData, lng: e.target.value })} 
                            placeholder="3.1234"
                        />
                    </div>

                    <div className="spe-input-group spe-location-action">
                        <button 
                            type="button" 
                            className="btn-text-icon" 
                            onClick={handleGetLocation}
                            disabled={geolocating}
                        >
                            <FiMapPin />
                            {geolocating ? (locale === 'ar' ? 'جاري التحديد...' : 'Localisation...') : (locale === 'ar' ? 'تحديد موقعي الحالي (GPS)' : 'Ma position actuelle')}
                        </button>
                    </div>

                    {/* Map Preview */}
                    <div className="spe-map-preview-wrapper spe-full">
                        <div className="spe-map-container">
                            <MapContainer 
                                center={[formData.lat || 36.737, formData.lng || 3.086]} 
                                zoom={13} 
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={false}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap'
                                />
                                {formData.lat && formData.lng && (
                                    <>
                                        <Marker position={[parseFloat(formData.lat), parseFloat(formData.lng)]} />
                                        <MapUpdater center={[parseFloat(formData.lat), parseFloat(formData.lng)]} />
                                    </>
                                )}
                            </MapContainer>
                            {(!formData.lat || !formData.lng) && (
                                <div className="map-overlay-hint">
                                    <FiMapPin size={24} />
                                    <p>{locale === 'ar' ? 'قم بتحديد الموقع ليظهر على الخريطة' : 'Localisez pour afficher sur la carte'}</p>
                                </div>
                            )}
                        </div>
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
