import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                background: 'var(--bg-main)' 
            }}>
                <div style={{ 
                    padding: '30px', 
                    background: 'var(--bg-surface)', 
                    borderRadius: 'var(--radius-2xl)',
                    boxShadow: 'var(--shadow-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div className="animate-spin" style={{ 
                        width: '40px', 
                        height: '40px', 
                        border: '4px solid rgba(255,255,255,0.1)', 
                        borderTop: '4px solid var(--primary)', 
                        borderRadius: '50%' 
                    }}></div>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
                        جاري التحميل... / Chargement...
                    </span>
                </div>
            </div>
        );
    }

    if (!user) {
        // Store intended destination to redirect back after login (if implementing returnTo)
        const currentPath = location.pathname;
        
        // Logical redirection based on path
        if (currentPath.startsWith('/admin')) {
            return <Navigate to="/admin-login" state={{ from: currentPath }} replace />;
        }
        if (currentPath.startsWith('/institution')) {
            return <Navigate to="/institution-login" state={{ from: currentPath }} replace />;
        }
        if (currentPath.startsWith('/vendor') || currentPath.startsWith('/seller')) {
            return <Navigate to="/vendor-login" state={{ from: currentPath }} replace />;
        }
        
        // Default fallback for general protected routes
        return <Navigate to="/login" state={{ from: currentPath }} replace />;
    }

    // Role Enforcement
    if (allowedRoles && !allowedRoles.includes(role)) {
        // Unauthorized access - avoid infinite loops by checking destination
        console.warn(`Access denied. Role ${role} is not authorized for ${location.pathname}`);
        
        // Smart fallback based on user role
        if (role === 'admin') return <Navigate to="/admin" replace />;
        if (role === 'institution') return <Navigate to="/institution-admin" replace />;
        if (role === 'seller') return <Navigate to="/vendor" replace />;
        
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
}
