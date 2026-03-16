import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { FiEye, FiUsers, FiStar, FiBell, FiPlus } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../lib/supabase';
import Skeleton from '../../../components/ui/Skeleton';
import './InstitutionOverview.css';

const statsData = [
    { name: 'Jan', views: 0 },
    { name: 'Feb', views: 0 },
    { name: 'Mar', views: 0 },
    { name: 'Apr', views: 100 },
    { name: 'May', views: 400 },
    { name: 'Jun', views: 300 },
    { name: 'Jul', views: 0 },
];

export default function InstitutionOverview() {
    const { t, locale, dir } = useI18n();
    const { institution } = useOutletContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({
        announcements: 0,
        reviews: 0,
        messages: 0,
        followers: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!institution) return;
            setLoading(true);

            try {
                // Fetch live counts
                const [annRes, revRes, msgRes] = await Promise.all([
                    supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('institution_id', institution.id),
                    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('institution_id', institution.id),
                    supabase.from('institution_messages').select('id', { count: 'exact', head: true }).eq('institution_id', institution.id)
                ]);

                setCounts({
                    announcements: annRes.count || 0,
                    reviews: revRes.count || 0,
                    messages: msgRes.count || 0,
                    followers: 0 // Placeholder until we have followers table
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [institution]);

    const cards = [
        { icon: <FiEye />, label: locale === 'ar' ? 'زيارات الملف' : 'Vues Profil', value: institution?.views_count || '0', change: '+0', color: '#3B82F6' },
        { icon: <FiStar />, label: locale === 'ar' ? 'التقييم العام' : 'Note Globale', value: institution?.avg_rating || '0.0', change: `${counts.reviews} ريفيو`, color: '#F59E0B' },
        { icon: <FiBell />, label: locale === 'ar' ? 'إعلانات نشطة' : 'Annonces', value: counts.announcements, change: locale === 'ar' ? 'تحديث مباشر' : 'Live update', color: '#10B981' },
        { icon: <FiUsers />, label: locale === 'ar' ? 'الرسائل والمراسلات' : 'Messages', value: counts.messages, change: locale === 'ar' ? `+${counts.messages} إجمالي` : `+${counts.messages} total`, color: '#EC4899' },
    ];


    return (
        <div className="inst-overview">
            <div className="inst-overview__header">
                <div>
                    <h1>
                        {loading || !institution ? (
                            <Skeleton width="250px" height="32px" />
                        ) : (
                            locale === 'ar' ? `أهلاً بك، ${institution.name_ar}!` : `Bienvenue، ${institution.name_fr}!`
                        )}
                    </h1>
                    <p>
                        {loading ? (
                            <Skeleton width="300px" height="18px" style={{ marginTop: '8px' }} />
                        ) : (
                            locale === 'ar' ? 'إليك ملخص أداء مؤسستك هذا الأسبوع' : 'Voici un résumé de vos performances cette semaine'
                        )}
                    </p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/institution-admin/announcements')}>
                    <FiPlus />
                    <span>{locale === 'ar' ? 'إعلان جديد' : 'Nouvelle Annonce'}</span>
                </button>
            </div>

            <div className="inst-overview__grid">
                {cards.map((card, i) => (
                    <div key={i} className="inst-stat-card">
                        <div className="inst-stat-card__icon" style={{ color: card.color, background: `${card.color}15` }}>
                            {card.icon}
                        </div>
                        <div className="inst-stat-card__content">
                            <span className="inst-stat-card__label">{card.label}</span>
                            <span className="inst-stat-card__value">
                                {loading ? <Skeleton width="40px" height="24px" /> : card.value}
                            </span>
                            <span className="inst-stat-card__change">
                                {loading ? <Skeleton width="60px" height="14px" /> : card.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="inst-overview__chart">
                <div className="chart-header">
                    <h3>{locale === 'ar' ? 'نمو المشاهدات' : 'Croissance des vues'}</h3>
                    <select>
                        <option>{locale === 'ar' ? 'آخر 7 أيام' : '7 derniers jours'}</option>
                        <option>{locale === 'ar' ? 'آخر 30 يوم' : '30 derniers jours'}</option>
                    </select>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    {loading ? (
                        <Skeleton width="100%" height="100%" />
                    ) : (
                        <ResponsiveContainer>
                            <AreaChart data={statsData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
