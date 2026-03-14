import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { FiSearch, FiUserPlus, FiMoreVertical, FiShield, FiUser, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import './UserManagement.css';

export default function UserManagement() {
    const { t, locale, dir } = useI18n();
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_admin_user_list');
            
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users via RPC:', err);
            // Fallback for transition
            try {
                const { data: fallback } = await supabase.from('profiles').select('*, wilayas(name_ar, name_fr)');
                if (fallback) setUsers(fallback);
            } catch (e) {}
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (id, currentStatus) => {
        // Simple mock for actual block/suspend logic
        alert('Blocked functionality: Integration with Edge Functions for Auth Management required.');
    };

    const filteredUsers = users.filter(u => 
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="loading-screen" style={{ color: '#fff', textAlign: 'center', padding: '100px' }}>{t('loading')}...</div>;

    return (
        <div className="user-mgmt" dir={dir}>
            <div className="user-mgmt__header">
                <h1 className="user-mgmt__title">{locale === 'ar' ? 'إدارة المستخدمين' : 'Gestion des utilisateurs'}</h1>
                <button className="add-user-btn">
                    <FiUserPlus size={18} />
                    <span>{locale === 'ar' ? 'إضافة مستخدم' : 'Ajouter'}</span>
                </button>
            </div>

            <div className="user-mgmt__search">
                <div className="search-bar">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder={locale === 'ar' ? 'بحث باسم المستخدم أو البريد...' : 'Chercher par nom ou email...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="user-table-wrap">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>{locale === 'ar' ? 'المستخدم' : 'Utilisateur'}</th>
                            <th>{locale === 'ar' ? 'الدور' : 'Rôle'}</th>
                            <th>{locale === 'ar' ? 'الولاية' : 'Wilaya'}</th>
                            <th>{locale === 'ar' ? 'تاريخ الانضمام' : 'Date d\'inscription'}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">{user.full_name?.[0]?.toUpperCase() || 'U'}</div>
                                        <div className="user-info">
                                            <span className="user-name">{user.full_name}</span>
                                            <span className="user-email">{user.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge role-badge--${user.role}`}>
                                        {user.role === 'admin' ? <FiShield size={12} /> : <FiUser size={12} />}
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className="wilaya-text">
                                        {locale === 'ar' ? user.wilayas?.name_ar : user.wilayas?.name_fr || user.wilaya}
                                    </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</td>
                                <td>
                                    <div className="user-actions">
                                        <button className="action-btn" title="Edit"><FiEdit2 size={14} /></button>
                                        <button className="action-btn action-btn--danger" title="Suspend"><FiTrash2 size={14} /></button>
                                        <button className="action-btn" title="More"><FiMoreVertical size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
