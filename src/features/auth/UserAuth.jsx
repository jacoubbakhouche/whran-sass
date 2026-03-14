import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { FiUser, FiMail, FiLock, FiArrowLeft, FiPhone } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import './UserAuth.css';

export default function UserAuth() {
    const { t, dir, locale } = useI18n();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine initial mode based on path if possible
    const [isLogin, setIsLogin] = useState(location.pathname !== '/signup');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
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
                navigate('/home');
            } else {
                const { error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.name,
                            phone: formData.phone,
                            role: 'user'
                        }
                    }
                });
                if (error) throw error;

                // Profile creation is now handled by the database trigger handle_new_user() using metadata
                navigate('/home');
            }
        } catch (err) {
            setErrorMsg(err.message || (locale === 'ar' ? 'حدث خطأ أثناء المصادقة.' : 'Une erreur s\'est produite lors de l\'authentification.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-auth" dir={dir}>
            <button className="back-to-app" onClick={() => navigate('/')}>
                <FiArrowLeft size={18} />
                <span>{locale === 'ar' ? 'الرجوع للرئيسية' : 'Retour à l\'accueil'}</span>
            </button>

            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-icon">👋</div>
                        <h1>{isLogin ? (locale === 'ar' ? 'تسجيل الدخول' : 'Connexion') : (locale === 'ar' ? 'إنشاء حساب جديد' : 'Créer un compte')}</h1>
                        <p>{isLogin 
                            ? (locale === 'ar' ? 'مرحباً بك مجدداً في إيدو إكسبيرت.' : 'Bon retour sur Edu-Expert.') 
                            : (locale === 'ar' ? 'انضم إلينا وابدأ رحلتك التعليمية اليوم.' : 'Rejoignez-nous et commencez votre voyage éducatif.')}
                        </p>
                    </div>

                    <div className="auth-toggle">
                        <button 
                            className={`toggle-btn ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            {locale === 'ar' ? 'دخول' : 'Connexion'}
                        </button>
                        <button 
                            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            {locale === 'ar' ? 'اشتراك' : 'Inscription'}
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {errorMsg && <div className="error-message" style={{ color: '#ef4444', textAlign: 'center', marginBottom: '16px', fontSize: '0.9rem' }}>{errorMsg}</div>}
                        
                        {!isLogin && (
                            <>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'الاسم الكامل' : 'Nom Complet'}</label>
                                    <div className="input-with-icon">
                                        <FiUser className="input-icon" />
                                        <input
                                            type="text"
                                            required
                                            placeholder={locale === 'ar' ? "محمد علي" : "Mohamed Ali"}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{locale === 'ar' ? 'رقم الهاتف' : 'Téléphone'}</label>
                                    <div className="input-with-icon">
                                        <FiPhone className="input-icon" style={{ position: 'absolute', [dir === 'rtl' ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0550 00 00 00"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            style={{ [dir === 'rtl' ? 'paddingRight' : 'paddingLeft']: '40px' }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                            <div className="input-with-icon">
                                <FiMail className="input-icon" />
                                <input
                                    type="email"
                                    required
                                    placeholder="your@email.com"
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
            </div>
        </div>
    );
}
