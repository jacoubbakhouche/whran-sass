import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { FiUsers, FiEye, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import Skeleton from '../../../components/ui/Skeleton';
import './InstitutionAnalytics.css';

export default function InstitutionAnalytics() {
    const { locale } = useI18n();
    const { institution } = useOutletContext();
    const [statsData, setStatsData] = useState({
        totalViews: 0,
        totalAnnouncements: 0,
        totalMessages: 0,
        engagementRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!institution) return;
            setLoading(true);
            try {
                // Fetch Announcements Count
                const { count: annCount } = await supabase
                    .from('announcements')
                    .select('*', { count: 'exact', head: true })
                    .eq('institution_id', institution.id);

                // Fetch Messages Count
                const { count: msgCount, error: msgError } = await supabase
                    .from('institution_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('institution_id', institution.id);
                
                // If tables don't exist yet, it might throw, so safely handle it
                const finalMsgCount = msgError ? 0 : (msgCount || 0);
                const finalAnnCount = annCount || 0;

                setStatsData({
                    totalViews: institution.views_count || 0,
                    totalAnnouncements: finalAnnCount,
                    totalMessages: finalMsgCount,
                    engagementRate: institution.views_count > 0 ? Math.round((finalMsgCount / institution.views_count) * 100) : 0
                });

            } catch (err) {
                console.error("Error fetching analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [institution]);

    const stats = [
        {
            title: locale === 'ar' ? 'الزيارات الكلية' : 'Visites totales',
            // Default 0 if loading, else format number
            value: loading ? <Skeleton width="60px" height="28px" /> : statsData.totalViews.toLocaleString(),
            trend: '+12%',
            trendUp: true,
            icon: <FiEye />
        },
        {
            title: locale === 'ar' ? 'الإعلانات المنشورة' : 'Annonces publiées',
            value: loading ? <Skeleton width="40px" height="28px" /> : statsData.totalAnnouncements,
            trend: '+5%',
            trendUp: true,
            icon: <FiUsers /> // Keeping icon name but changing meaning for now
        },
        {
            title: locale === 'ar' ? 'الرسائل الجديدة' : 'Nouveaux messages',
            value: loading ? <Skeleton width="40px" height="28px" /> : statsData.totalMessages,
            trend: statsData.totalMessages > 0 ? '+100%' : '0%',
            trendUp: statsData.totalMessages > 0,
            icon: <FiMessageSquare />
        },
        {
            title: locale === 'ar' ? 'معدل التفاعل' : 'Taux d\'engagement',
            value: loading ? <Skeleton width="50px" height="28px" /> : `${statsData.engagementRate}%`,
            trend: '+8%',
            trendUp: true,
            icon: <FiTrendingUp />
        }
    ];

    return (
        <div className="analytics-container animate-up">
            <div className="analytics-header">
                <div>
                    <h1>{locale === 'ar' ? 'الإحصائيات والأداء' : 'Statistiques et Performances'}</h1>
                    <p>{locale === 'ar' ? 'تابع أداء صفحة مؤسستك على المنصة' : 'Suivez les performances de votre page sur la plateforme'}</p>
                </div>
                <div className="date-filter">
                    <select className="filter-select">
                        <option value="7d">{locale === 'ar' ? 'آخر 7 أيام' : '7 derniers jours'}</option>
                        <option value="30d">{locale === 'ar' ? 'آخر 30 يوم' : '30 derniers jours'}</option>
                        <option value="1y">{locale === 'ar' ? 'هذا العام' : 'Cette année'}</option>
                    </select>
                </div>
            </div>

            <div className="stats-grid">
                {stats.map((stat, idx) => (
                    <div className="stat-card" key={idx}>
                        <div className="stat-card-top">
                            <div className="stat-icon-wrapper">
                                {stat.icon}
                            </div>
                            <span className={`trend-badge ${stat.trendUp ? 'trend-up' : 'trend-down'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="stat-value">{stat.value}</h3>
                        <p className="stat-title">{stat.title}</p>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                <div className="chart-card chart-large">
                    <h3>{locale === 'ar' ? 'زيارات الصفحة خلال الشهر' : 'Visites de la page ce mois-ci'}</h3>
                    {loading ? (
                        <div style={{ height: '220px' }}>
                            <Skeleton width="100%" height="100%" />
                        </div>
                    ) : (
                        <div className="chart-placeholder">
                            {/* Mock Bar Chart Area */}
                            <div className="mock-bar" style={{height: '30%'}}><span>1</span></div>
                            <div className="mock-bar" style={{height: '50%'}}><span>5</span></div>
                            <div className="mock-bar" style={{height: '40%'}}><span>10</span></div>
                            <div className="mock-bar" style={{height: '80%'}}><span>15</span></div>
                            <div className="mock-bar" style={{height: '60%'}}><span>20</span></div>
                            <div className="mock-bar" style={{height: '90%'}}><span>25</span></div>
                            <div className="mock-bar" style={{height: '100%'}}><span>30</span></div>
                        </div>
                    )}
                </div>
                
                <div className="chart-card chart-small">
                    <h3>{locale === 'ar' ? 'مصادر الزيارات' : 'Sources de trafic'}</h3>
                    {loading ? (
                        <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Skeleton variant="circle" width="150px" height="150px" />
                        </div>
                    ) : (
                        <div className="pie-chart-placeholder">
                            <div className="mock-pie"></div>
                        </div>
                    )}
                    <div className="pie-legend">
                        <div className="legend-item">
                            <span className="dot dot-1"></span>
                            {locale === 'ar' ? 'بحث مباشر' : 'Recherche directe'} (45%)
                        </div>
                        <div className="legend-item">
                            <span className="dot dot-2"></span>
                            {locale === 'ar' ? 'الخريطة' : 'Carte'} (35%)
                        </div>
                        <div className="legend-item">
                            <span className="dot dot-3"></span>
                            {locale === 'ar' ? 'مشاركة رابط' : 'Lien partagé'} (20%)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
