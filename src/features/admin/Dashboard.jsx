/**
 * Dashboard.jsx  —  Admin Overview Page
 * Fixed to use get_admin_registration_list() RPC for all stats,
 * avoiding RLS-blocked direct table queries.
 */
import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { FiHome, FiUsers, FiStar, FiClock, FiTrendingUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../../lib/supabase';
import './Dashboard.css';

const TYPE_COLORS = {
    school: '#6366F1', nursery: '#F59E0B', primary: '#10B981',
    middle: '#3B82F6', secondary: '#8B5CF6', university: '#EC4899',
    training: '#14B8A6',
};
const TYPE_LABELS_AR = {
    school: 'مدرسة', nursery: 'حضانة', primary: 'ابتدائي',
    middle: 'متوسط', secondary: 'ثانوي', university: 'جامعة', training: 'مركز تدريب',
};
const TYPE_LABELS_FR = {
    school: 'École', nursery: 'Crèche', primary: 'Primaire',
    middle: 'CEM', secondary: 'Lycée', university: 'Université', training: 'Formation',
};

export default function Dashboard() {
    const { locale, dir } = useI18n();
    const [loading, setLoading] = useState(true);
    const [registrations, setRegistrations] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [typeDistribution, setTypeDistribution] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // ✅ Single RPC call — bypasses RLS, returns all profiles + institutions
            const { data, error } = await supabase.rpc('get_admin_registration_list');
            if (error) throw error;

            setRegistrations(data || []);

            // ── Monthly registration chart (from created_at) ──────
            const months = locale === 'ar'
                ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
                : ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

            const monthlyCounts = Array(12).fill(0);
            data?.forEach(row => {
                if (row.created_at) {
                    monthlyCounts[new Date(row.created_at).getMonth()]++;
                }
            });
            setChartData(months.map((m, i) => ({ month: m, count: monthlyCounts[i] })));

            // ── Institution type distribution ─────────────────────
            const typeCounts = {};
            data?.filter(r => !r.is_profile_only && r.type).forEach(r => {
                typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
            });
            const dist = Object.entries(typeCounts).map(([type, value]) => ({
                name: locale === 'ar' ? (TYPE_LABELS_AR[type] || type) : (TYPE_LABELS_FR[type] || type),
                value,
                color: TYPE_COLORS[type] || '#888',
            }));
            setTypeDistribution(dist.length > 0 ? dist : [{ name: 'N/A', value: 1, color: '#333' }]);

        } catch (err) {
            console.error('[Dashboard] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Compute stats from RPC data ───────────────────────────────
    const stats = {
        total:     registrations.length,
        pending:   registrations.filter(r => r.profile_status === 'pending' || r.institution_status === 'pending' || r.institution_status === 'submitted').length,
        active:    registrations.filter(r => r.profile_status === 'active'  || r.institution_status === 'active').length,
        needsForm: registrations.filter(r => r.is_profile_only).length,
    };

    // ── Recent activity list ──────────────────────────────────────
    const recentActivity = [...registrations]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6)
        .map(row => ({
            icon: row.institution_status === 'active' || row.profile_status === 'active'
                ? <FiCheckCircle color="#10B981" />
                : row.is_profile_only
                    ? <FiAlertCircle color="#F59E0B" />
                    : <FiClock color="#6366F1" />,
            text: locale === 'ar'
                ? `${row.profile_role === 'seller' ? '🛒 بائع' : '🏢 مؤسسة'}: ${row.full_name || '—'}`
                : `${row.profile_role === 'seller' ? '🛒 Vendeur' : '🏢 Inst.'}: ${row.full_name || '—'}`,
            status: row.institution_status || row.profile_status,
            time: row.created_at
                ? new Date(row.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')
                : '—',
        }));

    const statCards = [
        { icon: <FiHome size={22}/>,         label: locale === 'ar' ? 'إجمالي التسجيلات' : 'Total inscriptions', value: stats.total,     color: '#6366F1' },
        { icon: <FiClock size={22}/>,         label: locale === 'ar' ? 'بانتظار المراجعة' : 'En attente',         value: stats.pending,   color: '#F59E0B' },
        { icon: <FiCheckCircle size={22}/>,   label: locale === 'ar' ? 'نشط ومفعّل' : 'Actifs',                 value: stats.active,    color: '#10B981' },
        { icon: <FiAlertCircle size={22}/>,   label: locale === 'ar' ? 'بانتظار الإعداد' : 'Sans profil inst.',   value: stats.needsForm, color: '#EC4899' },
    ];

    if (loading) {
        return (
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '100px', fontSize: '1.1rem' }}>
                ⏳ {locale === 'ar' ? 'جاري تحميل البيانات...' : 'Chargement des données...'}
            </div>
        );
    }

    return (
        <div className="dashboard" dir={dir}>
            <header className="dashboard__header">
                <h1 className="dashboard__title">
                    {locale === 'ar' ? 'نظرة عامة' : 'Vue d\'ensemble'}
                </h1>
                <button
                    onClick={fetchDashboardData}
                    style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem',
                    }}
                >
                    <FiTrendingUp size={16} />
                    {locale === 'ar' ? 'تحديث' : 'Actualiser'}
                </button>
            </header>

            {/* ── Stat Cards ─────────────────────────────────── */}
            <div className="dashboard__stats">
                {statCards.map((card, i) => (
                    <div key={i} className="stat-card" style={{ '--stat-color': card.color }}>
                        <div className="stat-card__icon" style={{ color: card.color }}>{card.icon}</div>
                        <div className="stat-card__info">
                            <span className="stat-card__value">{card.value}</span>
                            <span className="stat-card__label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Charts ─────────────────────────────────────── */}
            <div className="dashboard__charts">
                <div className="chart-card">
                    <h3 className="chart-card__title">
                        {locale === 'ar' ? 'التسجيلات الشهرية' : 'Inscriptions mensuelles'}
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.4)' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.4)' }} allowDecimals={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="count" fill="url(#adminGradient)" radius={[6,6,0,0]} />
                            <defs>
                                <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8B5CF6" />
                                    <stop offset="100%" stopColor="#6366F1" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3 className="chart-card__title">
                        {locale === 'ar' ? 'توزيع المؤسسات حسب النوع' : 'Répartition par type'}
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={typeDistribution}
                                cx="50%" cy="50%"
                                innerRadius={55} outerRadius={95}
                                paddingAngle={3} dataKey="value" stroke="none"
                            >
                                {typeDistribution.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-card__legend">
                        {typeDistribution.map((item, i) => (
                            <div key={i} className="chart-legend-item">
                                <span className="chart-legend-dot" style={{ background: item.color }} />
                                <span>{item.name} ({item.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Recent Activity ─────────────────────────────── */}
            <div className="dashboard__activity">
                <div className="activity-card">
                    <h3 className="activity-card__title">
                        {locale === 'ar' ? 'آخر النشاطات' : 'Activité récente'}
                    </h3>
                    <div className="activity-card__list">
                        {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                            <div key={i} className="activity-item">
                                <span className="activity-item__icon">{item.icon}</span>
                                <span className="activity-item__text">{item.text}</span>
                                <span
                                    className="activity-item__time"
                                    style={{
                                        background: item.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                                        color: item.status === 'active' ? '#10B981' : 'rgba(255,255,255,0.4)',
                                        padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem',
                                    }}
                                >
                                    {item.time}
                                </span>
                            </div>
                        )) : (
                            <p style={{ opacity: 0.4, textAlign: 'center', padding: '2rem' }}>
                                {locale === 'ar' ? 'لا يوجد نشاط مؤخراً' : 'Aucune activité récente'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
