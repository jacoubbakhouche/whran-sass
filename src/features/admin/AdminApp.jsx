/**
 * AdminApp.jsx  —  Standalone Admin Mini-App Entry Point
 * ─────────────────────────────────────────────────────────────────
 * Self-contained admin application. Works in two modes:
 *
 *  1. EMBEDDED (current):
 *     App.jsx → <Route path="/admin/*" element={<AdminApp />} />
 *
 *  2. STANDALONE (future extraction):
 *     main.jsx → <BrowserRouter><AdminApp basePath="/" /></BrowserRouter>
 *
 * To extract as a standalone project:
 *   - Copy src/features/admin/ → new project's src/
 *   - Copy src/lib/supabase.js → new project's src/lib/
 *   - Copy src/i18n/ → new project's src/i18n/
 *   - Create main.jsx wrapping <AdminApp basePath="/" /> in <BrowserRouter>
 * ─────────────────────────────────────────────────────────────────
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext';
import { I18nProvider, useI18n } from '../../i18n';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import InstitutionManagement from './InstitutionManagement';
import UserManagement from './UserManagement';
import VerificationRequests from './VerificationRequests';
import ContentModeration from './ContentModeration';

// ─── Loading screen shared across the mini-app ───────────────────
function AdminLoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#0f0f14',
            flexDirection: 'column',
            gap: '20px',
        }}>
            <div style={{
                width: '44px', height: '44px',
                border: '4px solid rgba(139,92,246,0.15)',
                borderTop: '4px solid #8B5CF6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
                جاري التحقق... / Vérification...
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─── Access Denied (wrong role tried to reach admin) ─────────────
function AdminAccessDenied() {
    const { locale } = useI18n();
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center', height: '100vh', background: '#0f0f14',
            color: '#fff', gap: '1rem', padding: '2rem', textAlign: 'center',
        }}>
            <div style={{ fontSize: '3rem' }}>🚫</div>
            <h1 style={{ color: '#ef4444' }}>
                {locale === 'ar' ? 'وصول مرفوض' : 'Accès refusé'}
            </h1>
            <p style={{ opacity: 0.6, maxWidth: '400px' }}>
                {locale === 'ar'
                    ? 'ليس لديك صلاحية الوصول إلى لوحة التحكم الإدارية.'
                    : "Vous n'avez pas les droits d'accès au tableau de bord admin."}
            </p>
            <button
                onClick={() => window.location.href = '/'}
                style={{
                    marginTop: '1rem', padding: '12px 28px', borderRadius: '99px',
                    border: 'none', background: '#6366F1', color: '#fff',
                    cursor: 'pointer', fontWeight: 600,
                }}
            >
                {locale === 'ar' ? 'العودة للتطبيق' : "Retour à l'app"}
            </button>
        </div>
    );
}

// ─── Inner router — only rendered when admin is authenticated ─────
function AdminRoutes() {
    return (
        <Routes>
            {/* Admin dashboard shell + pages */}
            <Route path="/" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="verifications" element={<VerificationRequests />} />
                <Route path="institutions"   element={<InstitutionManagement />} />
                <Route path="users"          element={<UserManagement />} />
                <Route path="moderation"     element={<ContentModeration />} />
                <Route path="settings"       element={
                    <div style={{ color: '#fff', textAlign: 'center', padding: '4rem' }}>
                        <h2>⚙️ {/* Settings */}الإعدادات</h2>
                        <p style={{ opacity: 0.5 }}>قريباً / Bientôt</p>
                    </div>
                } />
            </Route>
            {/* Any unknown admin sub-path → dashboard */}
            <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
    );
}

// ─── Auth-aware wrapper — the actual brain of the mini-app ────────
function AdminAppContent() {
    const { adminUser, loading } = useAdminAuth();

    if (loading) return <AdminLoadingScreen />;

    // If not logged in → show the login screen (replaces entire view)
    if (!adminUser) return <AdminLogin />;

    // Logged in & validated as admin → render the full dashboard
    return <AdminRoutes />;
}

// ─── Root export — wrap with all required providers ───────────────
export default function AdminApp() {
    return (
        <AdminAuthProvider>
            <I18nProvider>
                <AdminAppContent />
            </I18nProvider>
        </AdminAuthProvider>
    );
}
