import { useI18n } from '../../i18n';
import { Link } from 'react-router-dom';
import { FiGithub, FiFacebook, FiMail } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
    const { t, dir } = useI18n();

    return (
        <footer className="footer" dir={dir}>
            <div className="footer__inner container">
                <div className="footer__brand">
                    <Link to="/" className="footer__logo">
                        <span className="footer__logo-icon">🎓</span>
                        <span className="footer__logo-text">{t('appName')}</span>
                    </Link>
                    <p className="footer__desc">{t('appDescription')}</p>
                </div>

                <div className="footer__links">
                    <h4 className="footer__title">{t('home')}</h4>
                    <Link to="/">{t('home')}</Link>
                    <Link to="/search">{t('search')}</Link>
                    <Link to="/about">{t('about')}</Link>
                </div>

                <div className="footer__links">
                    <h4 className="footer__title">{t('contactInfo')}</h4>
                    <a href="mailto:contact@edu-expert.dz">{t('email')}</a>
                    <a href="tel:+21321000000">{t('phone')}</a>
                </div>

                <div className="footer__social">
                    <a href="#" className="footer__social-link" aria-label="Facebook"><FiFacebook size={20} /></a>
                    <a href="#" className="footer__social-link" aria-label="Email"><FiMail size={20} /></a>
                    <a href="#" className="footer__social-link" aria-label="GitHub"><FiGithub size={20} /></a>
                </div>
            </div>

            <div className="footer__bottom">
                <div className="container">
                    <p>© 2026 {t('appName')}. جميع الحقوق محفوظة / Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    );
}
