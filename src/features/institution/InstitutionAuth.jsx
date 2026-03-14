import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { FiHome, FiMail, FiLock, FiArrowLeft, FiPhone } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import './InstitutionAuth.css';

export default function InstitutionAuth() {
    const { t, dir, locale } = useI18n();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    const [needsVerification, setNeedsVerification] = useState(false);

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
                navigate('/institution-admin');
            } else {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.name,
                            phone: formData.phone,
                            role: 'institution'
                        }
                    }
                });
                if (signUpError) throw signUpError;

                if (signUpData.session === null) {
                    setNeedsVerification(true);
                } else {
                    // Profile creation is handled by the DB trigger handle_new_user().
                    // Navigate to the dashboard — RegistrationGuard will show the
                    // onboarding form (if has_filled_form !== true) or "Under Review" as appropriate.
                    navigate('/institution-admin');
                }
            }
        } catch (err) {
            console.error('Auth Error:', err);
            setErrorMsg(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="institution-auth" dir={dir}>
            <button className="back-to-app" onClick={() => navigate('/')}>
                <FiArrowLeft size={18} />
                <span>{locale === 'ar' ? 'الرجوع للتطبيق' : 'Retour à l\'app'}</span>
            </button>

            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-icon">🏢</div>
                        <h1>{isLogin ? (locale === 'ar' ? 'دخول المؤسسات' : 'Connexion Établissement') : (locale === 'ar' ? 'تسجيل مؤسسة جديدة' : 'Inscription Établissement')}</h1>
                        <p>{isLogin 
                            ? (locale === 'ar' ? 'قم بإدارة مؤسستك والوصول إلى لوحة التحكم الخاصة بك.' : 'Gérez votre établissement et accédez à votre tableau de bord.') 
                            : (locale === 'ar' ? 'انضم إلينا وابدأ في إدارة مؤسستك على منصة إيدو إكسبيرت.' : 'Rejoignez-nous et commencez à gérer votre établissement sur la plateforme Edu-expert.')}
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
                        
                        {needsVerification ? (
                            <div className="verification-message" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
                                <h2 style={{ color: 'var(--accent-warm)', marginBottom: '1rem' }}>{locale === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}</h2>
                                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                    {locale === 'ar' 
                                        ? 'لقد أرسلنا رابط تفعيل إلى بريدك الإلكتروني. يرجى تأكيد حسابك لتتمكن من إكمال ملف مؤسستك.' 
                                        : 'We have sent a verification link to your email. Please confirm your account to continue completing your institution profile.'}
                                </p>
                                <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/login')}>
                                    {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                                </button>
                            </div>
                        ) : (
                            <>
                                {!isLogin && (
                                    <div className="form-group">
                                        <label>{locale === 'ar' ? 'اسم المؤسسة' : 'Nom de l\'établissement'}</label>
                                        <div className="input-with-icon">
                                            <FiHome className="input-icon" />
                                            <input
                                                type="text"
                                                required
                                                placeholder={locale === 'ar' ? "مدرسة إيدو إكسبيرت للغات" : "École Edu-expert"}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                            placeholder="contact@school.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div className="form-group">
                                        <label>{locale === 'ar' ? 'رقم الهاتف' : 'Téléphone'}</label>
                                        <div className="input-with-icon">
                                            <FiPhone className="input-icon" />
                                            <input
                                                type="tel"
                                                required
                                                placeholder="0550 00 00 00"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

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
                            </>
                        )}
                    </form>
                </div>
                
                <div className="auth-illustration">
                    <div className="glass-panel">
                        <h3>{locale === 'ar' ? 'منصة إيدو إكسبيرت التعليمية' : 'Plateforme Éducative Edu-expert'}</h3>
                        <p>{locale === 'ar' ? 'الوجهة الأولى للبحث عن أفضل المؤسسات التعليمية والتواصل معها بسهولة وموثوقية.' : 'La première destination pour rechercher et contacter facilement les meilleurs établissements scolaires.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
