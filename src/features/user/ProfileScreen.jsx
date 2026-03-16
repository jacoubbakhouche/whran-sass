import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiEdit2, FiCheck, FiX, FiCamera, FiSettings, FiShoppingBag, FiHeart, FiGlobe, FiLock, FiBell, FiMapPin, FiChevronLeft, FiMessageSquare } from 'react-icons/fi';
import './ProfileScreen.css';

const WILAYA_NAMES = {};

function OrderStatusBadge({ status }) {
  const map = {
    pending:    { label: 'في الانتظار', cls: 'badge-orange' },
    processing: { label: 'قيد المعالجة', cls: 'badge-blue' },
    shipped:    { label: 'تم الشحن', cls: 'badge-blue' },
    delivered:  { label: 'تم التسليم', cls: 'badge-green' },
    cancelled:  { label: 'ملغى', cls: 'badge-pink' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-orange' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [threads, setThreads]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('favorites');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm]   = useState({ full_name: '', phone: '' });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) { navigate('/login'); return; }
        setUser(u);

        const [profRes, favRes, ordRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', u.id).single(),
          supabase.from('favorites').select('institutions(id, name_ar, logo_url, type, rating_avg)').eq('user_id', u.id),
          supabase.from('orders').select('id, status, total_amount, created_at').eq('user_id', u.id).order('created_at', { ascending: false }).limit(10)
        ]);

        if (profRes.data) {
          setProfile(profRes.data);
          setEditForm({ full_name: profRes.data.full_name || '', phone: profRes.data.phone || '' });
        }
        if (favRes.data) setFavorites(favRes.data.map(f => f.institutions).filter(Boolean));
        if (ordRes.data) setOrders(ordRes.data);

        // Fetch message threads
        const { data: messages, error: msgError } = await supabase
          .from('institution_messages')
          .select('*, institutions(id, name_ar, logo_url)')
          .or(`sender_id.eq.${u.id},reply_to.not.is.null`)
          .order('created_at', { ascending: true });

        if (!msgError && messages) {
          const rootMessages = messages.filter(m => !m.reply_to && m.sender_id === u.id);
          const replies = messages.filter(m => !!m.reply_to);

          const threadList = rootMessages.map(root => {
            const threadReplies = replies.filter(r => r.reply_to === root.id);
            const lastMsg = threadReplies.length > 0 ? threadReplies[threadReplies.length - 1] : root;
            return {
              ...root,
              replies: threadReplies,
              last_message: lastMsg,
              institution: root.institutions
            };
          }).sort((a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at));
          
          setThreads(threadList);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/welcome');
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone
        })
        .eq('id', user.id);
      
      if (error) throw error;
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  const roleLabels = { admin: 'المشرف', institution: 'مؤسسة', seller: 'بائع', user: 'مستخدم' };

  if (loading) {
    return (
      <div className="profile-page page" dir="rtl">
        <div className="profile-header" style={{ paddingBottom: '40px' }}>
          <div className="profile-header__avatar-wrap">
            <div className="profile-header__avatar skeleton skeleton-circle" />
          </div>
          <div style={{ padding: '20px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton skeleton-text" style={{ width: '140px', height: '20px' }} />
            <div className="skeleton skeleton-text short" />
            <div className="skeleton" style={{ width: '160px', height: '40px', marginTop: '16px', borderRadius: '12px' }} />
          </div>
        </div>
        <div className="profile-tabs" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
          {[1,2,3].map(n => <div key={n} className="skeleton" style={{ flex: 1, height: '40px', borderRadius: '12px' }} />)}
        </div>
        <div className="profile-section" style={{ padding: '20px' }}>
          {[1,2,3].map(n => <div key={n} className="skeleton" style={{ height: '80px', borderRadius: '16px', marginBottom: '12px' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page page" dir="rtl">
      {/* ─── Header ─── */}
      <div className="profile-header">
        <div className="profile-header__avatar-wrap">
          <div className="profile-header__avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" />
              : <span>👤</span>
            }
          </div>
          <button className="profile-header__edit-avatar">
            <FiCamera size={14} />
          </button>
        </div>

        {isEditing ? (
          <div className="profile-edit-form animate-fade">
            <input 
              className="profile-edit-input"
              type="text" 
              placeholder="الاسم الكامل" 
              value={editForm.full_name}
              onChange={e => setEditForm({...editForm, full_name: e.target.value})}
            />
            <input 
              className="profile-edit-input"
              type="tel" 
              placeholder="رقم الهاتف" 
              value={editForm.phone}
              onChange={e => setEditForm({...editForm, phone: e.target.value})}
            />
            <div className="profile-edit-actions">
              <button className="btn-save" onClick={handleUpdateProfile} disabled={saving}>
                {saving ? '...' : <><FiCheck /> حفظ</>}
              </button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                <FiX /> إلغاء
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="profile-header__name-row">
              <h2 className="profile-header__name">{profile?.full_name || 'مستخدم'}</h2>
              {profile?.is_active && (
                <span className="verified-badge-v2" title="حساب نشط">🛡️</span>
              )}
            </div>
            <div className="profile-header__badges">
              <span className="badge badge-green">{roleLabels[profile?.role] || 'مستخدم'}</span>
              {profile?.wilaya && (
                <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                  📍 {profile.wilaya}
                </span>
              )}
            </div>
          </>
        )}

        {profile?.role && profile.role !== 'user' && !isEditing && (
          <button className="btn-primary profile-header__dashboard-btn"
            style={{ marginTop: 'var(--space-4)', background: 'var(--accent)', border: 'none' }}
            onClick={() => {
              if (profile.role === 'institution') navigate('/institution-admin');
              if (profile.role === 'seller') navigate('/vendor');
              if (profile.role === 'admin') navigate('/admin');
            }}>
            🚀 دخول لوحة التحكم
          </button>
        )}
        
        {!isEditing && (
          <button className="btn-outline btn-primary profile-header__edit-btn"
            style={{ marginTop: 'var(--space-4)', fontSize: '0.85rem', padding: '10px 20px' }}
            onClick={() => setIsEditing(true)}>
            <FiEdit2 size={14} /> تعديل الملف
          </button>
        )}
      </div>

      {/* ─── Tabs ─── */}
      <div className="profile-tabs h-scroll" style={{ padding: '0 var(--space-5)', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'favorites', label: 'المفضلة', icon: <FiHeart /> },
          { id: 'messages',  label: 'رسائلي',   icon: <FiMessageSquare /> },
          { id: 'orders',    label: 'طلباتي',   icon: <FiShoppingBag /> },
          { id: 'settings',  label: 'الإعدادات', icon: <FiSettings /> },
        ].map(t => (
          <button
            key={t.id}
            className={`profile-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Messages Tab ─── */}
      {tab === 'messages' && (
        <div className="profile-section">
          {threads.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">💬</span>
              <h3>لا رسائل بعد</h3>
              <p>تواصل مع المؤسسات التعليمية للاستفسار</p>
              <button className="btn-primary" onClick={() => navigate('/search')}>
                ابدأ البحث
              </button>
            </div>
          ) : (
            <div className="profile-messages-list">
              {threads.slice(0, 3).map(thread => (
                <div key={thread.id} className="profile-msg-card card animate-up" onClick={() => navigate('/profile/messages')}>
                  <div className="profile-msg-card__header">
                    <span className="profile-msg-card__sender">{thread.institution?.name_ar || 'مؤسسة'}</span>
                    <span className="profile-msg-card__date">{new Date(thread.last_message.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="profile-msg-card__subject">{thread.subject}</p>
                  <p className="profile-msg-card__preview">{thread.last_message.content}</p>
                </div>
              ))}
              <button className="btn-outline w-full mt-4" onClick={() => navigate('/profile/messages')}>
                عرض كل الرسائل
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Favorites Tab ─── */}
      {tab === 'favorites' && (
        <div className="profile-section">
          {favorites.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">❤️</span>
              <h3>لا مؤسسات مفضلة</h3>
              <p>أضف المؤسسات لقائمة مفضلتك</p>
              <button className="btn-primary" onClick={() => navigate('/search')}>
                استعرض المؤسسات
              </button>
            </div>
          ) : (
            <div className="h-scroll" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              {favorites.map(inst => {
                const logoUrl = inst.logo_url
                  ? supabase.storage.from('institution-logos').getPublicUrl(inst.logo_url).data.publicUrl
                  : null;
                return (
                  <div
                    key={inst.id}
                    className="profile-fav-card card animate-up"
                    onClick={() => navigate(`/institution/${inst.id}`)}
                  >
                    <div className="profile-fav-card__logo">
                      {logoUrl ? <img src={logoUrl} alt="" /> : <span>🏛️</span>}
                    </div>
                    <p className="profile-fav-card__name">{inst.name_ar}</p>
                    <span className="stars">
                      <span className="star-icon">⭐</span>
                      <span style={{ fontFamily: 'var(--font-latin)' }}>{(inst.rating_avg || 0).toFixed(1)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Orders Tab ─── */}
      {tab === 'orders' && (
        <div className="profile-section">
          {orders.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h3>لا طلبات بعد</h3>
              <p>تصفح المتجر وقم بأول طلب</p>
              <button className="btn-primary" onClick={() => navigate('/store')}>
                المتجر
              </button>
            </div>
          ) : (
            <div className="profile-orders-list">
              {orders.map(ord => (
                <div key={ord.id} className="profile-order-card card animate-up">
                  <div className="profile-order-card__left">
                    <span className="profile-order-card__id" style={{ fontFamily: 'var(--font-latin)' }}>
                      #{ord.id.slice(0,8).toUpperCase()}
                    </span>
                    <span className="profile-order-card__date">
                      {new Date(ord.created_at).toLocaleDateString('ar-DZ')}
                    </span>
                  </div>
                  <div className="profile-order-card__right">
                    <OrderStatusBadge status={ord.status} />
                    <span className="profile-order-card__amount" style={{ fontFamily: 'var(--font-latin)' }}>
                      {ord.total_amount} دج
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ─── Settings Tab ─── */}
      {tab === 'settings' && (
        <div className="profile-section profile-settings">
          <div className="profile-settings-group">
            <h3 className="profile-settings-group__title">الحساب</h3>
            {[
              { icon: <FiLock />, label: 'تغيير كلمة المرور' },
              { icon: <FiMapPin />, label: 'تغيير الولاية والبلدية' },
              { icon: <FiBell />, label: 'تفعيل الإشعارات' },
              { icon: <FiGlobe />, label: 'اللغة: عربي / فرنسي' },
            ].map((item, i) => (
              <button key={i} className="profile-settings-item">
                <span className="profile-settings-item__icon">{item.icon}</span>
                <span className="profile-settings-item__label">{item.label}</span>
                <span className="profile-settings-item__arrow">
                  <FiChevronLeft />
                </span>
              </button>
            ))}
          </div>

          {(!profile?.role || profile.role === 'user') && (
            <div className="profile-settings-group">
              <h3 className="profile-settings-group__title">منطقة الأعمال والمهنيين</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', background: 'var(--accent)' }}
                  onClick={() => navigate('/pro-portal')}
                >
                  💼 دخول فضاء المهنيين (مؤسسات / مكاتب)
                </button>
              </div>
            </div>
          )}

          <div className="profile-settings-group">
            <button className="profile-settings-item profile-logout-btn" onClick={handleLogout}>
              <span className="profile-settings-item__icon">🚪</span>
              <span style={{ color: '#E53E3E' }}>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
