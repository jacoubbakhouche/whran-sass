import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  FiCamera,
  FiEdit2,
  FiMessageSquare,
  FiHeart,
  FiShoppingBag,
  FiSettings,
  FiLogOut,
  FiBriefcase
} from 'react-icons/fi';
import './ProfileScreen.css';

const quickActions = [
  {
    label: 'الرسائل',
    desc: 'تابع المحادثات مع المؤسسات',
    icon: <FiMessageSquare size={18} />,
    path: '/profile/messages'
  },
  {
    label: 'المفضلة',
    desc: 'مؤسساتك المحفوظة',
    icon: <FiHeart size={18} />,
    path: '/favorites'
  },
  {
    label: 'الطلبات',
    desc: 'مشترياتك الأخيرة',
    icon: <FiShoppingBag size={18} />,
    path: '/orders'
  },
  {
    label: 'الإعدادات',
    desc: 'إدارة الحساب والتنبيهات',
    icon: <FiSettings size={18} />,
    path: '/settings'
  }
];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setForm({ full_name: data.full_name || '', phone: data.phone || '' });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update(form).eq('id', profile.id);
      setProfile({ ...profile, ...form });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/welcome');
  };

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  const roleLabels = {
    admin: 'مشرف',
    institution: 'مؤسسة',
    seller: 'بائع',
    user: 'مستخدم'
  };

  const canDashboard = profile?.role && profile.role !== 'user';

  if (loading) {
    return (
      <div className="profile-page page" dir="rtl">
        <div className="profile-header skeleton"></div>
      </div>
    );
  }

  return (
    <div className="profile-page page" dir="rtl">
      <div className="profile-header">
        <div className="profile-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" />
          ) : (
            <span role="img" aria-hidden="true">
              👤
            </span>
          )}
          <button type="button" className="avatar-edit">
            <FiCamera size={16} />
          </button>
        </div>
        <h2>{profile?.full_name || 'مستخدم'}</h2>
        <p className="profile-role">{roleLabels[profile?.role] || 'مستخدم'}</p>
        <p className="profile-meta">📍 {profile?.wilaya || 'غير محددة'}</p>

        {!isEditing ? (
          <button className="btn-outline btn-primary" onClick={() => setIsEditing(true)}>
            <FiEdit2 size={16} /> تعديل الملف
          </button>
        ) : (
          <div className="profile-edit-form">
            <input
              type="text"
              placeholder="الاسم الكامل"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="profile-edit-actions">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
              <button className="btn-ghost" onClick={() => setIsEditing(false)}>
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="profile-actions">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="profile-action-card"
            onClick={() => navigate(action.path)}
          >
            <span className="profile-action-icon">{action.icon}</span>
            <div className="profile-action-text">
              <h4>{action.label}</h4>
              <p>{action.desc}</p>
            </div>
          </button>
        ))}
      </section>

      <section className="profile-cta">
        {canDashboard ? (
          <button
            className="btn-primary profile-dashboard-btn"
            onClick={() => {
              if (profile.role === 'institution') navigate('/institution-admin');
              else if (profile.role === 'seller') navigate('/vendor');
              else if (profile.role === 'admin') navigate('/admin');
            }}
          >
            <FiBriefcase size={18} /> دخول لوحة التحكم
          </button>
        ) : (
          <button className="btn-primary profile-dashboard-btn profile-dashboard-btn--accent" onClick={() => navigate('/pro-portal')}>
            <FiBriefcase size={18} /> فضاء المهنيين
          </button>
        )}

        <button className="profile-logout" onClick={handleLogout}>
          <FiLogOut size={18} /> تسجيل الخروج
        </button>
      </section>
    </div>
  );
}
