/**
 * AdminLogin.jsx  —  Admin Authentication Screen
 * Part of the standalone Admin Mini-App.
 * No navigate() calls needed — AdminAuthContext state change
 * causes AdminApp to re-render and show AdminRoutes automatically.
 */
import { useState } from 'react';
import { useI18n } from '../../i18n';
import { FiLock, FiMail } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import './AdminLogin.css';

export default function AdminLogin() {
    const { dir, locale } = useI18n();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            // Role check — sign out immediately if not admin
            const role = user?.user_metadata?.role || user?.app_metadata?.role;
            if (role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error(
                    locale === 'ar'
                        ? 'عذراً، ليس لديك صلاحيات المسؤول.'
                        : "Accès refusé. Vous n'avez pas les droits administrateur."
                );
            }

            // ✅ Success — AdminAuthContext onAuthStateChange fires automatically.
            // AdminApp re-renders and shows <AdminRoutes /> without any navigate() call.

        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login" dir={dir}>
            {/* Back link — hidden in standalone mode, useful when embedded */}
            <a
                href="/"
                className="back-to-app"
                style={{ display: window.location.pathname.startsWith('/admin') ? 'flex' : 'none' }}
            >
                <span>← {locale === 'ar' ? 'الرجوع للتطبيق' : "Retour à l'app"}</span>
            </a>

            <div className="login-card">
                <div className="login-card__header">
                    <div className="login-logo">🎓</div>
                    <h1>{locale === 'ar' ? 'لوحة تحكم المسؤول' : 'Espace Admin'}</h1>
                    <p>
                        {locale === 'ar'
                            ? 'قم بتسجيل الدخول لإدارة منصة إيدو إكسبيرت'
                            : 'Gérez la plateforme Edu-Expert'}
                    </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {errorMsg && (
                        <div className="error-message" style={{
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                            padding: '12px 16px', borderRadius: '8px',
                            marginBottom: '16px', fontSize: '0.9rem',
                            border: '1px solid rgba(239,68,68,0.2)',
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    <div className="form-group">
                        <label>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                        <div className="input-with-icon">
                            <FiMail className="input-icon" />
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="admin@taalim.dz"
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
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading
                            ? (locale === 'ar' ? 'جاري الدخول...' : 'Connexion...')
                            : (locale === 'ar' ? 'دخول' : 'Se connecter')}
                    </button>
                </form>
            </div>
        </div>
    );
}
