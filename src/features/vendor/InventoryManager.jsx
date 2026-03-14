import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiX, FiUpload, FiBox } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './InventoryManager.css';

export default function InventoryManager() {
    const { locale, dir } = useI18n();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('active'); // Account status
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '', price: '', stock_qty: '', category_id: '',
        description: '', cover_url: '', image_url_2: '', image_url_3: '',
        is_active: true
    });

    const [imageFiles, setImageFiles] = useState({ 1: null, 2: null, 3: null });
    const [previews, setPreviews] = useState({ 1: '', 2: '', 3: '' });

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('status')
                .eq('id', user.id)
                .single();
            if (profile) setStatus(profile.status);

            const { data: cats } = await supabase
                .from('product_categories')
                .select('*')
                .order('name_ar');
            if (cats) setCategories(cats);

            const { data, error } = await supabase
                .from('products')
                .select('*, product_categories(name_ar, name_fr)')
                .eq('seller_id', user.id);
            
            if (error) throw error;
            if (data) setProducts(data);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, num) => {
        const file = e.target.files[0];
        if (file) {
            setImageFiles(prev => ({ ...prev, [num]: file }));
            setPreviews(prev => ({ ...prev, [num]: URL.createObjectURL(file) }));
        }
    };

    const uploadFile = async (file, path) => {
        const { data, error } = await supabase.storage
            .from('products')
            .upload(path, file, { upsert: true });
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(path);
            
        return publicUrl;
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!user) return;
        if (['pending', 'rejected', 'suspended'].includes(status)) {
            alert(locale === 'ar' ? 'حسابك غير مفعل حالياً' : 'Votre compte n\'est pas activé');
            return;
        }

        setSubmitting(true);
        try {
            // Sequential Image Uploads
            let urls = { cover_url: '', image_url_2: '', image_url_3: '' };
            const timestamp = Date.now();

            for (let num of [1, 2, 3]) {
                if (imageFiles[num]) {
                    const ext = imageFiles[num].name.split('.').pop();
                    const path = `${user.id}/${timestamp}-${num}.${ext}`;
                    const publicUrl = await uploadFile(imageFiles[num], path);
                    const key = num === 1 ? 'cover_url' : `image_url_${num}`;
                    urls[key] = publicUrl;
                }
            }

            const { data, error } = await supabase
                .from('products')
                .insert({
                    ...formData,
                    ...urls,
                    seller_id: user.id,
                    status: 'active'
                })
                .select()
                .single();
            
            if (error) throw error;
            setProducts([data, ...products]);
            setShowModal(false);
            
            // Reset
            setFormData({ 
                name: '', price: '', stock_qty: '', 
                category_id: categories[0]?.id || '', 
                description: '', cover_url: '', image_url_2: '', image_url_3: '',
                is_active: true
            });
            setImageFiles({ 1: null, 2: null, 3: null });
            setPreviews({ 1: '', 2: '', 3: '' });
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Confirmer la suppression ?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting product:', err);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="inventory-mgr" dir={dir}>
            <div className="inventory-mgr__header">
                <div>
                    <h1>{locale === 'ar' ? 'إدارة المخزون' : 'Gestion du stock'}</h1>
                    <p>{locale === 'ar' ? 'أضف وتحكم في منتجاتك التعليمية المعروضة في المتجر' : 'Gérez vos produits éducatifs en ligne'}</p>
                </div>
                <button 
                    className="btn-add-prod" 
                    onClick={() => setShowModal(true)}
                    disabled={['pending', 'rejected', 'suspended'].includes(status)}
                >
                    <FiPlus />
                    <span>{locale === 'ar' ? 'إضافة منتج' : 'Ajouter'}</span>
                </button>
            </div>

            {/* Constraint Message if not active */}
            {['pending', 'rejected', 'suspended'].includes(status) && (
                <div className="restriction-banner" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <FiAlertCircle />
                    <span>
                        {locale === 'ar' 
                            ? 'لقد تم تقييد حسابك. لا يمكنك إضافة منتجات جديدة حتى يتم تفعيل الحساب.' 
                            : 'Votre compte a été restreint. Vous ne pouvez pas ajouter de nouveaux produits.'}
                    </span>
                </div>
            )}

            <div className="inventory-mgr__toolbar">
                <div className="search-pill">
                    <FiSearch />
                    <input 
                        placeholder={locale === 'ar' ? 'بحث عن منتج...' : 'Chercher...'} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-tool-icon"><FiFilter /></button>
            </div>

            <div className="inventory-mgr__grid">
                {loading ? (
                    [1,2,3].map(n => <div key={n} className="skeleton-card" />)
                ) : filteredProducts.length === 0 ? (
                    <div className="empty-inventory">
                        <FiBox size={60} />
                        <h3>{locale === 'ar' ? 'المخزون فارغ' : 'Stock vide'}</h3>
                        <p>ابدأ بإضافة أول منتج لك لتبدأ في البيع</p>
                    </div>
                ) : filteredProducts.map((prod) => (
                    <div key={prod.id} className="inv-card animate-up">
                        <div className="inv-card__img">
                            {prod.cover_url ? (
                                <img src={prod.cover_url} alt={prod.name} />
                            ) : (
                                <span className="placeholder-icon">📚</span>
                            )}
                            <span className={`stock-tag ${prod.stock_qty <= 5 ? 'stock-tag--low' : ''}`}>
                                {prod.stock_qty}
                            </span>
                        </div>
                        <div className="inv-card__body">
                            <span className="inv-cat">
                                {locale === 'ar' ? prod.product_categories?.name_ar : prod.product_categories?.name_fr}
                            </span>
                            <h3>{prod.name}</h3>
                            <div className="inv-meta">
                                <span className="inv-price">{prod.price} دج</span>
                                <div className="inv-actions">
                                    <button className="icon-action"><FiEdit2 /></button>
                                    <button className="icon-action icon-action--del" onClick={() => handleDelete(prod.id)}><FiTrash2 /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Product Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-container animate-scale">
                        <div className="modal-header">
                            <h3>{locale === 'ar' ? 'إضافة منتج جديد' : 'Nouveau Produit'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleAddProduct}>
                            <div className="form-group">
                                <label>{locale === 'ar' ? 'اسم المنتج' : 'Nom'}</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="مثلاً: كتاب العلوم الطبيعية"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'السعر (دج)' : 'Prix'}</label>
                                    <input 
                                        type="number" required
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'الكمية' : 'Stock'}</label>
                                    <input 
                                        type="number" required
                                        value={formData.stock_qty}
                                        onChange={e => setFormData({...formData, stock_qty: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{locale === 'ar' ? 'التصنيف' : 'Catégorie'}</label>
                                <select 
                                    value={formData.category_id}
                                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {locale === 'ar' ? cat.name_ar : cat.name_fr}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{locale === 'ar' ? 'الوصف' : 'Description'}</label>
                                <textarea 
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                            <div className="image-uploads">
                                <label>{locale === 'ar' ? 'صور المنتج (3 صور)' : 'Images du produit (3 images)'}</label>
                                <div className="image-inputs-grid">
                                    {[1, 2, 3].map(num => (
                                        <div key={num} className={`image-input-box ${previews[num] ? 'has-preview' : ''}`}>
                                            {previews[num] ? (
                                                <img src={previews[num]} alt="Preview" className="upload-preview" />
                                            ) : (
                                                <FiUpload />
                                            )}
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={e => handleFileChange(e, num)}
                                            />
                                            <span className="file-label">
                                                {previews[num] ? (locale === 'ar' ? 'تغيير الصورة' : 'Changer') : (locale === 'ar' ? `رابط الصورة ${num}` : `Lien image ${num}`)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn-save-prod" disabled={submitting}>
                                {submitting ? '...' : (locale === 'ar' ? 'حفظ المنتج' : 'Enregistrer')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
