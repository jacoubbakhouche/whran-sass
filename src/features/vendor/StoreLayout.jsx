import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { FiShoppingBag, FiPackage, FiMessageCircle, FiTrendingUp, FiLogOut, FiMenu, FiX, FiPlusCircle, FiUser } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import './StoreLayout.css';

export default function StoreLayout() {
    const { t, locale, dir, toggleLocale } = useI18n();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [restriction, setRestriction] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/welcome');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (error) throw error;
            
            // Constraint: Role check
            if (data.role !== 'seller' && data.role !== 'admin') {
                navigate('/home');
                return;
            }

            setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-screen" style={{ color: '#fff', textAlign: 'center', padding: '100px' }}>{t('loading')}...</div>;

    const navItems = [
        { path: '/vendor', icon: <FiShoppingBag />, label: locale === 'ar' ? 'المتجر' : 'Boutique', end: true },
        { path: '/vendor/inventory', icon: <FiPackage />, label: locale === 'ar' ? 'المنتجات' : 'Produits' },
        { path: '/vendor/orders', icon: <FiMessageCircle />, label: locale === 'ar' ? 'الطلبات' : 'Commandes' },
        { path: '/vendor/analytics', icon: <FiTrendingUp />, label: locale === 'ar' ? 'المبيعات' : 'Ventes' },
        { path: '/vendor/messages', icon: <FiMessageSquare />, label: locale === 'ar' ? 'الرسائل' : 'Messages' },
        { path: '/vendor/reviews', icon: <FiStar />, label: locale === 'ar' ? 'التقييمات' : 'Avis' },
        { path: '/vendor/profile', icon: <FiUser />, label: locale === 'ar' ? 'الملف الشخصي' : 'Profil' },
    ];

    return (
        <div className="store-admin" dir={dir}>
            <aside className={`store-sidebar ${mobileOpen ? 'store-sidebar--open' : ''}`}>
                <div className="store-sidebar__header">
                    <span className="store-sidebar__logo-icon">🛍️</span>
                    <span className="store-sidebar__logo-text">{t('appName')} {locale === 'ar' ? 'بائع' : 'Vendor'}</span>
                </div>

                <nav className="store-sidebar__nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `store-sidebar__link ${isActive ? 'store-sidebar__link--active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="store-sidebar__link-icon">{item.icon}</span>
                            <span className="store-sidebar__link-text">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="store-sidebar__footer">
                    <button className="store-sidebar__link" onClick={toggleLocale}>
                        <span className="store-sidebar__link-icon">🌐</span>
                        <span className="store-sidebar__link-text">{locale === 'ar' ? 'Français' : 'العربية'}</span>
                    </button>
                    <button className="store-sidebar__link" onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/welcome');
                    }}>
                        <span className="store-sidebar__link-icon"><FiLogOut /></span>
                        <span className="store-sidebar__link-text">{t('logout')}</span>
                    </button>
                </div>
            </aside>

            <main className="store-main">
                <header className="store-topbar">
                    <button className="store-topbar__menu" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                    <div className="store-topbar__title">
                        {locale === 'ar' ? 'لوحة تحكم البائع' : 'Tableau de bord Vendeur'}
                    </div>
                    <div className="store-topbar__user">
                        <div className="store-topbar__info">
                            <span className="store-topbar__name">{profile?.store_name || profile?.full_name} <small style={{opacity: 0.5, fontSize: '0.7em'}}>(ID: {profile?.id?.slice(0,8)})</small></span>
                            <span className="store-topbar__role">
                                {profile?.wilaya} • {profile?.role === 'admin' ? 'الأدمن' : (locale === 'ar' ? 'بائع معتمد' : 'Vendeur Certifié')}
                            </span>
                        </div>
                        <div className="store-topbar__avatar">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}} />
                            ) : (
                                (profile?.store_name || profile?.full_name)?.split(' ').map(n => n[0]).join('').toUpperCase() || 'V'
                            )}
                        </div>
                    </div>
                </header>

                <div className="store-content">
                    <Outlet />
                </div>
            </main>

            {mobileOpen && <div className="store-overlay" onClick={() => setMobileOpen(false)} />}
        </div>
    );
}
