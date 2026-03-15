import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { FiGrid, FiUser, FiBell, FiMessageSquare, FiTrendingUp, FiLogOut, FiMenu, FiX, FiLayers } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import './InstitutionLayout.css';

import InstitutionOnboarding from './InstitutionOnboarding';

export default function InstitutionLayout() {
    const { t, locale, dir, toggleLocale } = useI18n();
    const navigate = useNavigate();
    const { user, signOut: authSignOut } = useAuth();
    const [profile, setProfile] = useState(null);
    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        
        // Fetch both profile and institution
        const [profileRes, instRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('institutions').select('*').eq('owner_id', user.id).maybeSingle()
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (instRes.data) setInstitution(instRes.data);
        
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleSignOut = async () => {
        await authSignOut();
        navigate('/welcome');
    };

    if (loading) return <div className="loading-screen">{t('loading')}...</div>;

    // RegistrationGuard handles 'suspended', 'pending' (account level), and 'rejected' (account level) labels.
    // Institution-specific statuses like 'draft' or 'info_requested' are handled here for onboarding.

    // Simplified Stage: Show Onboarding if not active
    if (!institution || institution.status === 'draft') {
        return <InstitutionOnboarding onComplete={fetchData} />;
    }

    // Default: Show Dashboard (No longer blocking for under_review/rejected for now as requested)

    const navItems = [
        { path: '/institution-admin', icon: <FiGrid />, label: locale === 'ar' ? 'نظرة عامة' : 'Aperçu', end: true },
        { path: '/institution-admin/profile', icon: <FiUser />, label: locale === 'ar' ? 'الملف الشخصي' : 'Profil' },
        { path: '/institution-admin/announcements', icon: <FiBell />, label: locale === 'ar' ? 'الإعلانات' : 'Annonces' },
        { path: '/institution-admin/messages', icon: <FiMessageSquare />, label: locale === 'ar' ? 'الرسائل' : 'Messages' },
        { path: '/institution-admin/analytics', icon: <FiTrendingUp />, label: locale === 'ar' ? 'الإحصائيات' : 'Stats' },
    ];

    return (
        <div className="inst-admin" dir={dir}>
            {/* Sidebar */}
            <aside className={`inst-sidebar ${mobileOpen ? 'inst-sidebar--open' : ''}`}>
                <div className="inst-sidebar__header">
                    <span className="inst-sidebar__logo-icon">🏫</span>
                    <span className="inst-sidebar__logo-text">{t('appName')}</span>
                </div>

                <nav className="inst-sidebar__nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `inst-sidebar__link ${isActive ? 'inst-sidebar__link--active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="inst-sidebar__link-icon">{item.icon}</span>
                            <span className="inst-sidebar__link-text">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="inst-sidebar__footer">
                    <button className="inst-sidebar__link" onClick={toggleLocale}>
                        <span className="inst-sidebar__link-icon">🌐</span>
                        <span className="inst-sidebar__link-text">{locale === 'ar' ? 'Français' : 'العربية'}</span>
                    </button>
                    <button className="inst-sidebar__link" onClick={handleSignOut}>
                        <span className="inst-sidebar__link-icon"><FiLogOut /></span>
                        <span className="inst-sidebar__link-text">{t('logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="inst-main">
                <header className="inst-topbar">
                    <button className="inst-topbar__menu" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                    <div className="inst-topbar__user">
                        <div className="inst-topbar__info">
                            <span className="inst-topbar__name">
                                {institution ? (locale === 'ar' ? (institution.name_ar || institution.name_fr) : (institution.name_fr || institution.name_ar)) : '...'}
                            </span>
                            <span className="inst-topbar__role">{locale === 'ar' ? 'مدير مؤسسة' : 'Admin Inst.'}</span>
                        </div>
                        <div className="inst-topbar__avatar">
                            {institution ? (institution.name_fr || institution.name_ar || 'I').substring(0, 1).toUpperCase() : 'I'}
                        </div>
                    </div>
                </header>

                <div className="inst-content">
                    <Outlet context={{ institution }} />
                </div>
            </main>

            {mobileOpen && <div className="inst-overlay" onClick={() => setMobileOpen(false)} />}
        </div>
    );
}
