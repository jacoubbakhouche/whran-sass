import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiActivity, FiUsers } from 'react-icons/fi';
import './InventoryManager.css'; // Reusing some shared styles

export default function Analytics() {
    const { locale, dir } = useI18n();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        monthlyRevenue: [],
        topProducts: [],
        orderStatus: [],
        summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, conversionRate: '3.2%' }
    });

    useEffect(() => {
        if (!user) return;
        fetchAnalytics();
    }, [user]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch Order Items for this seller
            const { data: itemData, error: itemError } = await supabase
                .from('order_items')
                .select(`
                    total_price, quantity,
                    products!inner(id, name, seller_id),
                    orders!inner(created_at, status)
                `)
                .eq('products.seller_id', user.id);
            
            if (itemError) throw itemError;

            // 1. Process Monthly Revenue & Orders
            const monthlyMap = {};
            const productSalesMap = {};
            const statusMap = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
            let totalRevenue = 0;

            itemData.forEach(item => {
                const date = new Date(item.orders.created_at);
                const month = date.toLocaleString(locale === 'ar' ? 'ar-DZ' : 'en-US', { month: 'short' });
                
                if (!monthlyMap[month]) monthlyMap[month] = { name: month, revenue: 0, orders: 0 };
                monthlyMap[month].revenue += item.total_price;
                monthlyMap[month].orders += 1;
                totalRevenue += item.total_price;

                // Top Products
                if (!productSalesMap[item.products.name]) productSalesMap[item.products.name] = 0;
                productSalesMap[item.products.name] += item.total_price;

                // Status
                statusMap[item.orders.status] = (statusMap[item.orders.status] || 0) + 1;
            });

            // Format Charts
            const monthlyRevenue = Object.values(monthlyMap);
            const topProducts = Object.entries(productSalesMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            
            const orderStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

            setData({
                monthlyRevenue,
                topProducts,
                orderStatus,
                summary: {
                    totalRevenue,
                    totalOrders: itemData.length,
                    avgOrderValue: itemData.length ? Math.round(totalRevenue / itemData.length) : 0,
                    conversionRate: '4.5%'
                }
            });
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

    if (loading) return <div className="loading-state" style={{ padding: '100px' }}>جاري تحميل الإحصائيات...</div>;

    return (
        <div className="analytics-page animate-fade" dir={dir}>
            <div className="analytics-header">
                <h1>{locale === 'ar' ? 'تحليل المبيعات' : 'Sales Analytics'}</h1>
                <p>نظرة متعمقة على أداء متجرك ونمو مبيعاتك</p>
            </div>

            <div className="analytics-summary">
                <div className="summary-card">
                    <FiDollarSign className="icon" />
                    <div className="info">
                        <span>إجمالي الأرباح</span>
                        <h3>{data.summary.totalRevenue} دج</h3>
                    </div>
                </div>
                <div className="summary-card">
                    <FiShoppingBag className="icon" style={{ borderColor: '#10B981', color: '#10B981' }} />
                    <div className="info">
                        <span>إجمالي الطلبات</span>
                        <h3>{data.summary.totalOrders}</h3>
                    </div>
                </div>
                <div className="summary-card">
                    <FiActivity className="icon" style={{ borderColor: '#F59E0B', color: '#F59E0B' }} />
                    <div className="info">
                        <span>متوسط قيمة الطلب</span>
                        <h3>{data.summary.avgOrderValue} دج</h3>
                    </div>
                </div>
                <div className="summary-card">
                    <FiUsers className="icon" style={{ borderColor: '#3B82F6', color: '#3B82F6' }} />
                    <div className="info">
                        <span>معدل التحويل</span>
                        <h3>{data.summary.conversionRate}</h3>
                    </div>
                </div>
            </div>

            <div className="analytics-grid">
                {/* Revenue Over Time */}
                <div className="chart-card large">
                    <h3> {locale === 'ar' ? 'نمو الأرباح والطلبات' : 'Revenue & Orders Growth'}</h3>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.monthlyRevenue}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}} />
                                <Area type="monotone" dataKey="revenue" name="الأرباح" stroke="#6366F1" strokeWidth={3} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="orders" name="الطلبات" stroke="#10B981" strokeWidth={3} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="chart-card">
                    <h3> {locale === 'ar' ? 'أفضل المنتجات مبيعاً' : 'Top Selling Products'}</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" name="المبيعات" fill="#6366F1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Distribution */}
                <div className="chart-card">
                    <h3> {locale === 'ar' ? 'حالة الطلبات' : 'Order Status'}</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.orderStatus}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.orderStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .analytics-page { padding: 2rem; }
                .analytics-header { margin-bottom: 2.5rem; }
                .analytics-header h1 { font-size: 2.2rem; color: #1e293b; margin-bottom: 0.5rem; }
                .analytics-header p { color: #64748b; font-size: 1.1rem; }
                
                .analytics-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                
                .summary-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                    border: 1px solid #f1f5f9;
                }
                
                .summary-card .icon {
                    width: 50px;
                    height: 50px;
                    padding: 12px;
                    border-radius: 14px;
                    background: rgba(99, 102, 241, 0.1);
                    color: #6366F1;
                    border: 1.5px solid rgba(99, 102, 241, 0.2);
                    font-size: 1.5rem;
                }
                
                .summary-card .info span { color: #64748b; font-size: 0.9rem; display: block; margin-bottom: 0.3rem; }
                .summary-card .info h3 { font-size: 1.5rem; color: #1e293b; }
                
                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }
                
                .chart-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 24px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                }
                
                .chart-card.large { grid-column: span 2; }
                .chart-card h3 { margin-bottom: 2rem; color: #334155; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; }
                
                @media (max-width: 1024px) {
                    .analytics-grid { grid-template-columns: 1fr; }
                    .chart-card.large { grid-column: span 1; }
                }
            `}</style>
        </div>
    );
}
