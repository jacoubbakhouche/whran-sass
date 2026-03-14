/**
 * AdminAuthContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * Self-contained admin authentication context.
 * Completely independent from the main app's AuthContext.
 *
 * When extracting to a standalone admin project:
 *   - Copy this file as-is
 *   - Only dependency: ../../lib/supabase  (copy lib/supabase.js too)
 * ─────────────────────────────────────────────────────────────────
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
    const [adminUser, setAdminUser]       = useState(null);
    const [adminProfile, setAdminProfile] = useState(null);
    const [loading, setLoading]           = useState(true);

    useEffect(() => {
        // Bootstrap: check existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                validateAdminSession(session.user);
            } else {
                setLoading(false);
            }
        });

        // Live: react to login / logout events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user) {
                    validateAdminSession(session.user);
                } else {
                    setAdminUser(null);
                    setAdminProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    /**
     * Fetches the profile and validates the role is 'admin'.
     * Uses auth.jwt() metadata for role, so it won't hit an RLS recursion.
     */
    const validateAdminSession = async (user) => {
        try {
            // Primary check: user_metadata set at creation time
            const role =
                user.user_metadata?.role ||
                user.app_metadata?.role;

            if (role !== 'admin') {
                // Not an admin — sign them out silently
                await supabase.auth.signOut();
                setAdminUser(null);
                setAdminProfile(null);
                setLoading(false);
                return;
            }

            // Fetch the full profile row (RLS "Admins can view all profiles" policy allows this)
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setAdminUser(user);
            setAdminProfile(profile ?? { id: user.id, full_name: user.email, role: 'admin' });
        } catch (err) {
            console.error('[AdminAuth] Session validation failed:', err);
            setAdminUser(null);
            setAdminProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setAdminUser(null);
        setAdminProfile(null);
    };

    return (
        <AdminAuthContext.Provider value={{ adminUser, adminProfile, loading, signOut }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export const useAdminAuth = () => {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
    return ctx;
};
