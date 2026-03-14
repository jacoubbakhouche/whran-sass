import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { FiShoppingBag, FiMail, FiLock, FiArrowLeft, FiPhone } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import './VendorAuth.css';

export default function VendorAuth() {
    const { t, dir, locale } = useI18n();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({
        storeName: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });
                if (error) throw error;
                navigate('/vendor');
            } else {
                const { data: { user }, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.storeName,
                            role: 'seller'
                        }
                    }
                });
                if (error) throw error;

                // Profile creation is handled by the DB trigger handle_new_user().
                // Navigate to the vendor dashboard — RegistrationGuard will show the
                // onboarding form or "Under Review" screen as appropriate.
                navigate('/vendor');
            }
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vendor-auth" dir={dir}>
            <button className="back-to-app" onClick={() => navigate('/')}>
                <FiArrowLeft size={18} />
                <span>{locale === 'ar' ? 'الرجوع للتطبيق' : 'Retour à l\'app'}</span>
            </button>

            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-icon">🏪</div>
                        <h1>{isLogin ? (locale === 'ar' ? 'دخول المتاجر' : 'Connexion Boutique') : (locale === 'ar' ? 'تسجيل متجر جديد' : 'Inscription Boutique')}</h1>
                        <p>{isLogin 
                            ? (locale === 'ar' ? 'قم بإدارة متجرك والوصول إلى لوحة التحكم الخاصة بك.' : 'Gérez votre boutique et accédez à votre tableau de bord.') 
                            : (locale === 'ar' ? 'انضم إلينا وابدأ في بيع منتجاتك على منصة إيدو إكسبيرت.' : 'Rejoignez-nous et commencez à vendre vos produits sur la plateforme Edu-expert.')}
                        </p>
                    </div>

                    <div className="auth-toggle">
                        <button 
                            className={`toggle-btn ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            {locale === 'ar' ? 'تسجيل الدخول' : 'Se Connecter'}
                        </button>
                        <button 
                            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            {locale === 'ar' ? 'اشتراك' : 'S\'inscrire'}
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {errorMsg && <div className="error-message" style={{ color: '#ef4444', textAlign: 'center', marginBottom: '16px', fontSize: '0.9rem' }}>{errorMsg}</div>}
                        {!isLogin && (
                            <div className="form-group">
                                <label>{locale === 'ar' ? 'اسم المتجر' : 'Nom de la boutique'}</label>
                                <div className="input-with-icon">
                                    <FiShoppingBag className="input-icon" />
                                    <input
                                        type="text"
                                        required
                                        placeholder={locale === 'ar' ? "متجر الشروق للأدوات المدرسية" : "Boutique Al-Chourouk"}
                                        value={formData.storeName}
                                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                            <div className="input-with-icon">
                                <FiMail className="input-icon" />
                                <input
                                    type="email"
                                    required
                                    placeholder="contact@store.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{locale === 'ar' ? 'كلمة المرور' : 'Mot de passe'}</label>
                            <div className="input-with-icon">
                                <FiLock className="input-icon" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            {isLogin && (
                                <div className="forgot-password">
                                    <a href="#">{locale === 'ar' ? 'هل نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}</a>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading 
                                ? (locale === 'ar' ? 'يرجى الانتظار...' : 'Veuillez patienter...') 
                                : (isLogin ? (locale === 'ar' ? 'دخول' : 'Se connecter') : (locale === 'ar' ? 'إنشاء حساب' : 'Créer un compte'))}
                        </button>
                    </form>
                </div>
                
                <div className="auth-illustration">
                    <div className="glass-panel">
                        <h3>{locale === 'ar' ? 'سوق إيدو إكسبيرت' : 'Marché Edu-expert'}</h3>
                        <p>{locale === 'ar' ? 'المنصة المثالية لبيع المستلزمات المدرسية، الكتب، والأدوات التعليمية للمدراس والطلاب.' : 'La plateforme idéale pour vendre des fournitures scolaires, des livres et des outils éducatifs aux écoles et aux étudiants.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
