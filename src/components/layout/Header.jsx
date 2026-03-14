import { useI18n } from '../../i18n';
import { FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

export default function Header() {
    const { t, locale, toggleLocale, dir } = useI18n();
    const { user, profile, signOut } = useAuth();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleDark = () => {
        setDarkMode(prev => !prev);
        document.documentElement.setAttribute('data-theme', darkMode ? 'light' : 'dark');
    };

    const isAdmin = location.pathname.startsWith('/admin');
    if (isAdmin) return null;

    return (
        <header className={`header ${scrolled ? 'header--scrolled' : ''}`} dir={dir}>
            <div className="header__inner container">
                <Link to="/search" className="header__logo">
                    <span className="header__logo-icon">🎓</span>
                    <span className="header__logo-text">{t('appName')}</span>
                </Link>

                <div className="header__actions">
                    <button className="header__lang-btn" onClick={toggleLocale} title={t('language')}>
                        {locale === 'ar' ? 'FR' : 'عر'}
                    </button>
                    <button className="header__icon-btn" onClick={toggleDark} title="Toggle theme">
                        {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                    </button>
                    
                    {user ? (
                        <div className="header__user-menu">
                            <Link to="/profile" className="header__user-name">
                                {profile?.full_name?.split(' ')[0] || t('user')}
                            </Link>
                            <button className="header__logout-btn" onClick={signOut}>
                                {dir === 'rtl' ? 'خروج' : 'Exit'}
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="header__admin-btn">
                            {t('admin')}
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
