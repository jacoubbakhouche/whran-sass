import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import { FiClock, FiAlertCircle, FiShieldOff, FiLogOut, FiArrowLeft } from 'react-icons/fi';

export default function AccountStatusScreen() {
    const { profile, loading, signOut } = useAuth();
    const { locale, t, dir } = useI18n();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
                <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', color: 'var(--text-main)' }}>
                    جاري التحميل... / Loading...
                </div>
            </div>
        );
    }

    // Default content for generic waiting (usually when just signed up and profile/status not yet fully propagated or specifically pending)
    const status = profile?.status || 'pending';

    const getContent = () => {
        switch (status) {
            case 'pending':
            case 'submitted':
                return {
                    icon: <FiClock size={64} color="var(--primary)" />,
                    title: locale === 'ar' ? 'طلبك قيد المراجعة' : 'Demande en attente',
                    message: locale === 'ar' 
                        ? 'شكراً لتسجيلك في إيدو إكسبيرت! حسابك حالياً قيد المراجعة والتدقيق من قبل فريق الإدارة. ستتلقى إشعاراً بمجرد تفعيل حسابك.' 
                        : 'Merci de vous être inscrit sur Edu-expert ! Votre compte est en cours d\'examen par notre équipe administrative. Vous recevrez une notification dès que votre compte sera activé.'
                };
            case 'rejected':
                return {
                    icon: <FiShieldOff size={64} color="#ef4444" />,
                    title: locale === 'ar' ? 'تم رفض الطلب' : 'Demande refusée',
                    message: locale === 'ar' 
                        ? 'نأسف لإبلاغك بأنه تم رفض طلب انضمامك. يرجى مراجعة البريد الإلكتروني أو التواصل مع الدعم الفني لمزيد من المعلومات.' 
                        : 'Nous regrettons de vous informer que votre demande a été refusée. Veuillez consulter vos emails ou contacter le support pour plus d\'informations.'
                };
            case 'suspended':
                return {
                    icon: <FiAlertCircle size={64} color="#f59e0b" />,
                    title: locale === 'ar' ? 'الحساب معلق' : 'Compte suspendu',
                    message: locale === 'ar' 
                        ? 'تم تعليق حسابك مؤقتاً لمخالفة شروط الاستخدام أو لأسباب تقنية. يرجى التواصل مع الإدارة.' 
                        : 'Votre compte a été temporairement suspendu. Veuillez contacter l\'administration pour plus de détails.'
                };
            case 'active':
                return {
                    icon: <div style={{ fontSize: '4rem' }}>✅</div>,
                    title: locale === 'ar' ? 'تم التفعيل!' : 'Activé !',
                    message: locale === 'ar' 
                        ? 'حسابك الآن نشط وجاهز للاستخدام. يمكنك التوجه إلى لوحة التحكم الخاصة بك.' 
                        : 'Votre compte est maintenant actif. Vous pouvez accéder à votre tableau de bord.'
                };
            default:
                return {
                    icon: <FiClock size={64} color="var(--primary)" />,
                    title: locale === 'ar' ? 'بانتظار الموافقة' : 'En attente d\'approbation',
                    message: locale === 'ar' 
                        ? 'يرجى الانتظار بينما يقوم النظام بمعالجة بياناتك.' 
                        : 'Veuillez patienter pendant que le système traite vos données.'
                };
        }
    };

    const content = getContent();

    const handleAction = async () => {
        if (status === 'active') {
            const role = profile?.role;
            if (role === 'institution') navigate('/institution-admin');
            else if (role === 'seller') navigate('/vendor');
            else navigate('/home');
        } else {
            await signOut();
            navigate('/welcome');
        }
    };

    return (
        <div className="account-status-screen" dir={dir} style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--bg-main)',
            color: 'var(--text-main)',
            position: 'relative'
        }}>
            {/* Background decorative elements */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, var(--primary-soft) 0%, transparent 70%)',
                opacity: 0.3,
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{ zIndex: 1, maxWidth: '600px' }}>
                <div className="animate-bounce-slow" style={{ 
                    marginBottom: '2.5rem', 
                    display: 'inline-flex',
                    padding: '2rem',
                    background: 'var(--bg-surface)',
                    borderRadius: '50%',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-light)'
                }}>
                    {content.icon}
                </div>
                
                <h1 style={{ 
                    marginBottom: '1.5rem', 
                    color: status === 'rejected' ? '#ef4444' : 'var(--primary)', 
                    fontWeight: 800, 
                    fontSize: '2.5rem',
                    letterSpacing: '-0.5px'
                }}>
                    {content.title}
                </h1>
                
                <p style={{ 
                    opacity: 0.8, 
                    lineHeight: '1.8', 
                    marginBottom: '3rem', 
                    fontSize: '1.15rem',
                    padding: '0 20px'
                }}>
                    {content.message}
                </p>
                
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button 
                        className="btn-primary" 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            padding: '14px 40px',
                            borderRadius: 'var(--radius-xl)',
                            fontWeight: 600,
                            boxShadow: 'var(--shadow-lg)'
                        }} 
                        onClick={handleAction}
                    >
                        {status === 'active' ? (
                            <span>{locale === 'ar' ? 'دخول لوحة التحكم' : 'Accéder au Dashboard'}</span>
                        ) : (
                            <>
                                <FiLogOut />
                                <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Se déconnecter'}</span>
                            </>
                        )}
                    </button>
                    
                    {status !== 'active' && (
                        <button 
                            className="btn-secondary" 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                padding: '14px 30px',
                                borderRadius: 'var(--radius-xl)',
                                background: 'transparent',
                                border: '1px solid var(--border-light)'
                            }} 
                            onClick={() => navigate('/')}
                        >
                            <FiArrowLeft />
                            <span>{locale === 'ar' ? 'الرجوع للمتجر' : 'Retour au store'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Support section */}
            <div style={{ 
                marginTop: '4rem', 
                padding: '1.5rem', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.9rem',
                color: 'var(--text-muted)'
            }}>
                {locale === 'ar' 
                    ? 'هل لديك استفسار؟ تواصل معنا عبر support@edu-expert.com' 
                    : 'Une question ? Contactez-nous via support@edu-expert.com'}
            </div>
        </div>
    );
}
