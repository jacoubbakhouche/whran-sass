import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import { FiClock, FiAlertCircle, FiShieldOff, FiLogOut } from 'react-icons/fi';

export default function RegistrationGuard() {
    const { profile, loading, signOut } = useAuth();
    const { locale, t } = useI18n();

    /**
     * NOTE: RESTRICTIONS TEMPORARILY DISABLED FOR TESTING
     * The logic below is commented out to allow all users (pending, active, submitted)
     * to access the application directly.
     */
    return <Outlet />;

    /*
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
                <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', color: 'var(--text-main)' }}>
                    جاري التحميل... / Loading...
                </div>
            </div>
        );
    }

    // If status is active, allow access to nested routes
    if (profile?.status === 'active') {
        return <Outlet />;
    }

    // Pass-through Logic:
    // If status is 'pending'/'submitted' AND user hasn't filled the form yet, allow them to enter the dashboard
    // so the Layout's internal onboarding component can be shown.
    if ((profile?.status === 'pending' || profile?.status === 'submitted') && profile?.has_filled_form !== true) {
        return <Outlet />;
    }

    // Define content based on status
    const getContent = () => {
        switch (profile?.status) {
            case 'pending':
            case 'submitted':
                return {
                    icon: <FiClock size={60} color="var(--primary)" />,
                    title: locale === 'ar' ? 'حسابك قيد المراجعة' : 'Compte en cours de vérification',
                    message: locale === 'ar' 
                        ? 'شكراً لإرسال بياناتك! حسابك حالياً قيد المراجعة من قبل الإدارة. ستتمكن من الوصول الكامل بمجرد تفعيل الحساب.' 
                        : 'Merci d\'avoir envoyé vos informations ! Votre compte est en cours d\'examen par l\'administration. Vous y aurez accès dès qu\'il sera activé.'
                };
            case 'rejected':
                return {
                    icon: <FiShieldOff size={60} color="#ef4444" />,
                    title: locale === 'ar' ? 'تم رفض الحساب' : 'Compte refusé',
                    message: locale === 'ar' 
                        ? 'نأسف لإبلاغك بأنه تم رفض طلب انضمامك. يرجى التواصل مع الدعم للمزيد من التفاصيل.' 
                        : 'Nous regrettons de vous informer que votre demande a été refusée. Veuillez contacter le support pour plus de détails.'
                };
            case 'suspended':
                return {
                    icon: <FiAlertCircle size={60} color="#f59e0b" />,
                    title: locale === 'ar' ? 'الحساب معلق' : 'Compte suspendu',
                    message: locale === 'ar' 
                        ? 'تم تعليق حسابك مؤقتاً. يرجى التواصل مع الإدارة.' 
                        : 'Votre compte a été suspendu. Veuillez contacter l\'administration.'
                };
            default:
                // Fallback for missing profile or unexpected status
                return {
                    icon: <FiAlertCircle size={60} />,
                    title: locale === 'ar' ? 'وصول مقيد' : 'Accès restreint',
                    message: locale === 'ar' 
                        ? 'يرجى إكمال ملف التعريف الخاص بك أو انتظار التفعيل.' 
                        : 'Veuillez compléter votre profil ou attendre l\'activation.'
                };
        }
    };

    const content = getContent();

    return (
        <div className="verification-wait" style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--bg-main)',
            color: 'var(--text-main)'
        }}>
            <div className="animate-bounce-slow" style={{ marginBottom: '2rem', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>
                {content.icon}
            </div>
            
            <h1 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 800, fontSize: '2rem' }}>
                {content.title}
            </h1>
            
            <p style={{ maxWidth: '500px', opacity: 0.8, lineHeight: '1.7', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                {content.message}
            </p>
            
            <button 
                className="btn-primary" 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '12px 30px',
                    borderRadius: 'var(--radius-lg)'
                }} 
                onClick={async () => {
                    await signOut();
                    window.location.href = '/';
                }}
            >
                <FiLogOut />
                <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Se déconnecter'}</span>
            </button>
        </div>
    );
    */
}
