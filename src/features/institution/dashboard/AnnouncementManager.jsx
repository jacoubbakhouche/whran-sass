import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiCheckCircle, FiX } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import './AnnouncementManager.css';

export default function AnnouncementManager() {
    const { t, locale, dir, getField } = useI18n();
    const { institution } = useOutletContext();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [newAnn, setNewAnn] = useState({
        title_ar: '', title_fr: '',
        content_ar: '', content_fr: ''
    });

    useEffect(() => {
        const fetchAnnouncements = async () => {
            if (!institution) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('announcements')
                    .select('*')
                    .eq('institution_id', institution.id)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                if (data) setAnnouncements(data);
            } catch (err) {
                console.error('Error fetching announcements:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncements();
    }, [institution]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!institution) {
            alert(locale === 'ar' ? 'خطأ: لم يتم العثور على بيانات المؤسسة' : 'Erreur: Institution non trouvée');
            return;
        }
        setFormLoading(true);
        try {
            const { data, error } = await supabase
                .from('announcements')
                .insert([{ ...newAnn, institution_id: institution.id }])
                .select();
            
            if (error) throw error;
            if (data && data.length > 0) {
                setAnnouncements([data[0], ...announcements]);
                setIsModalOpen(false);
                setNewAnn({ title_ar: '', title_fr: '', content_ar: '', content_fr: '' });
                alert(locale === 'ar' ? 'تم نشر الإعلان بنجاح!' : 'Annonce publiée !');
            }
        } catch (err) {
            console.error('Error creating announcement:', err);
            alert(locale === 'ar' ? 'خطأ في النشر: ' + (err.message || err.details || 'Unknown error') : 'Erreur: ' + (err.message || ''));
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الإعلان؟' : 'Confirmer la suppression ?')) return;

        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error deleting announcement:', err);
        }
    };

    return (
        <div className="announcements">
            <div className="announcements__header">
                <div>
                    <h1>{locale === 'ar' ? 'إدارة الإعلانات' : 'Gestion des annonces'}</h1>
                    <p>{locale === 'ar' ? 'انشر مواعيد التسجيل والفعاليات الخاصة بمؤسستك' : 'Publiez vos périodes d\'inscription et événements'}</p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <FiPlus />
                    <span>{locale === 'ar' ? 'إعلان جديد' : 'Nouveau'}</span>
                </button>
            </div>

            {/* Modal for New Announcement */}
            {isModalOpen && (
                <div className="ann-modal-overlay">
                    <div className="ann-modal glass animate-up">
                        <div className="ann-modal__header">
                            <h3>{locale === 'ar' ? 'إضافة إعلان جديد' : 'Nouvelle Annonce'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'العنوان (العربية)' : 'Titre (Arabe)'}</label>
                                <input required value={newAnn.title_ar} onChange={e => setNewAnn({...newAnn, title_ar: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'العنوان (الفرنسية)' : 'Titre (Français)'}</label>
                                <input required value={newAnn.title_fr} onChange={e => setNewAnn({...newAnn, title_fr: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'المحتوى (العربية)' : 'Contenu (Arabe)'}</label>
                                <textarea required rows={4} value={newAnn.content_ar} onChange={e => setNewAnn({...newAnn, content_ar: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label>{locale === 'ar' ? 'المحتوى (الفرنسية)' : 'Contenu (Français)'}</label>
                                <textarea required rows={4} value={newAnn.content_fr} onChange={e => setNewAnn({...newAnn, content_fr: e.target.value})} />
                            </div>
                            <button type="submit" className="btn-save" disabled={formLoading}>
                                {formLoading ? '...' : (locale === 'ar' ? 'نشر الآن' : 'Publier')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="announcement-list">
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '40px' }}>
                        {locale === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
                    </p>
                ) : announcements.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                        {locale === 'ar' ? 'لا توجد إعلانات حالياً' : 'Aucune annonce'}
                    </p>
                ) : announcements.map(ann => (
                    <div key={ann.id} className="ann-card">
                        <div className="ann-card__content">
                            <div className="ann-card__top">
                                <span className={`status-tag status-tag--active`}>
                                    <FiCheckCircle />
                                    Active
                                </span>
                                <span className="ann-date">{new Date(ann.created_at).toLocaleDateString()}</span>
                            </div>
                            <h3>{getField(ann, 'title')}</h3>
                            <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '8px' }}>
                                {getField(ann, 'content')?.substring(0, 100)}...
                            </p>
                        </div>
                        <div className="ann-card__actions">
                            <button title="Edit"><FiEdit2 /></button>
                            <button 
                                title="Delete" 
                                className="btn-delete"
                                onClick={() => handleDelete(ann.id)}
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
