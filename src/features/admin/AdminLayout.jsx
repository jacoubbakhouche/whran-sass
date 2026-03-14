/**
 * AdminLayout.jsx  —  Persistent Shell for the Admin Mini-App
 * Uses useAdminAuth() for signout and real admin profile display.
 */
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import {
    FiGrid, FiHome, FiUsers, FiSettings, FiLogOut,
    FiMenu, FiX, FiChevronLeft, FiChevronRight,
    FiCheck, FiShield,
} from 'react-icons/fi';
import { useAdminAuth } from './AdminAuthContext';
import './AdminLayout.css';

export default function AdminLayout() {
    const { t, locale, dir, toggleLocale } = useI18n();
    const navigate = useNavigate();
    const { adminProfile, signOut } = useAdminAuth();
    const [collapsed, setCollapsed]   = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { path: '.',              icon: <FiGrid size={20} />,    label: locale === 'ar' ? 'نظرة عامة' : 'Vue d\'ensemble',     end: true },
        { path: 'verifications',  icon: <FiCheck size={20} />,   label: locale === 'ar' ? 'طلبات التحقق' : 'Vérifications' },
        { path: 'institutions',   icon: <FiHome size={20} />,    label: locale === 'ar' ? 'المؤسسات' : 'Établissements' },
        { path: 'users',          icon: <FiUsers size={20} />,   label: locale === 'ar' ? 'المستخدمون' : 'Utilisateurs' },
        { path: 'moderation',     icon: <FiShield size={20} />,  label: locale === 'ar' ? 'مراقبة المحتوى' : 'Modération' },
        { path: 'settings',       icon: <FiSettings size={20} />,label: locale === 'ar' ? 'الإعدادات' : 'Paramètres' },
    ];

    const handleSignOut = async () => {
        await signOut();
        // Redirect back to the main app's welcome page (embedded mode)
        // In standalone mode this would go to '/'
        window.location.href = '/welcome';
    };

    // Admin display name: full_name from profile, fallback to email initials
    const adminName = adminProfile?.full_name || adminProfile?.email || 'Admin';
    const adminInitial = adminName.charAt(0).toUpperCase();

    return (
        <div className={`admin ${collapsed ? 'admin--collapsed' : ''}`} dir={dir}>

            {/* ─── Sidebar ─────────────────────────────────────── */}
            <aside className={`admin-sidebar ${mobileOpen ? 'admin-sidebar--open' : ''}`}>
                <div className="admin-sidebar__header">
                    <span className="admin-sidebar__logo-icon">🎓</span>
                    {!collapsed && (
                        <span className="admin-sidebar__logo-text">
                            {locale === 'ar' ? 'إيدو إكسبيرت' : 'Edu-Expert'}
                            <small style={{ display: 'block', fontSize: '0.65rem', opacity: 0.5, marginTop: '2px' }}>
                                {locale === 'ar' ? 'لوحة المسؤول' : 'Admin Panel'}
                            </small>
                        </span>
                    )}
                    <button
                        className="admin-sidebar__collapse"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed
                            ? (dir === 'rtl' ? <FiChevronLeft size={18}/> : <FiChevronRight size={18}/>)
                            : (dir === 'rtl' ? <FiChevronRight size={18}/> : <FiChevronLeft size={18}/>)
                        }
                    </button>
                </div>

                <nav className="admin-sidebar__nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            relative="route"
                            className={({ isActive }) =>
                                `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
                            }
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className="admin-sidebar__link-icon">{item.icon}</span>
                            {!collapsed && <span className="admin-sidebar__link-text">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar__footer">
                    <button className="admin-sidebar__link" onClick={toggleLocale}>
                        <span className="admin-sidebar__link-icon">🌐</span>
                        {!collapsed && (
                            <span className="admin-sidebar__link-text">
                                {locale === 'ar' ? 'Français' : 'العربية'}
                            </span>
                        )}
                    </button>
                    <button className="admin-sidebar__link" onClick={handleSignOut}>
                        <span className="admin-sidebar__link-icon"><FiLogOut size={20} /></span>
                        {!collapsed && (
                            <span className="admin-sidebar__link-text">
                                {locale === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
                            </span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="admin-overlay" onClick={() => setMobileOpen(false)} />
            )}

            {/* ─── Main Content ─────────────────────────────────── */}
            <main className="admin-main">
                <header className="admin-topbar">
                    <button className="admin-topbar__menu" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>

                    <h2 className="admin-topbar__title">
                        {locale === 'ar' ? 'لوحة التحكم' : 'Tableau de bord'}
                    </h2>

                    {/* Real admin name from DB profile */}
                    <div className="admin-topbar__user">
                        <div className="admin-topbar__info" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                            <span className="admin-topbar__name">{adminName}</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block' }}>
                                {locale === 'ar' ? 'مسؤول' : 'Administrateur'}
                            </span>
                        </div>
                        <div className="admin-topbar__avatar">{adminInitial}</div>
                    </div>
                </header>

                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
