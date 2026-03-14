import { useState, useEffect } from 'react';
import { useI18n } from '../../../i18n';
import { FiShoppingBag, FiUsers, FiTrendingUp, FiCreditCard, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function VendorOverview() {
    const { locale, dir } = useI18n();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalSales: 0,
        ordersCount: 0,
        productsCount: 0,
        revenue: 0,
        trends: { revenue: '0%', orders: '0%', products: 'Stable', customers: '0%' }
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // 1. Products Count
                const { count: prodsCount } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('seller_id', user.id);

                // 2. Orders & Revenue from order_items (specific to this seller)
                const { data: itemData, error: itemError } = await supabase
                    .from('order_items')
                    .select(`
                        id, quantity, total_price, order_id,
                        products!inner(seller_id),
                        orders!inner(created_at, buyer_id)
                    `)
                    .eq('products.seller_id', user.id);
                
                if (itemError) throw itemError;

                const revenue = itemData.reduce((sum, item) => sum + (item.total_price || 0), 0);
                const uniqueOrders = new Set(itemData.map(i => i.order_id)).size;
                const totalQuantity = itemData.reduce((sum, item) => sum + (item.quantity || 0), 0);
                const uniqueCustomers = new Set(itemData.map(i => i.orders.buyer_id)).size;

                // 3. Chart Data (Last 7 Months)
                const monthsAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const months = locale === 'ar' ? monthsAr : monthsEn;
                
                const monthBuckets = {};
                const last7Months = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const mName = months[d.getMonth()];
                    monthBuckets[mName] = { name: mName, sales: 0, orders: 0, _orderIds: new Set() };
                    last7Months.push(mName);
                }

                itemData.forEach(item => {
                    const d = new Date(item.orders.created_at);
                    const mName = months[d.getMonth()];
                    if (monthBuckets[mName]) {
                        monthBuckets[mName].sales += item.total_price || 0;
                        monthBuckets[mName]._orderIds.add(item.order_id);
                    }
                });

                const formattedChartData = last7Months.map(mName => ({
                    name: mName,
                    sales: monthBuckets[mName].sales,
                    orders: monthBuckets[mName]._orderIds.size
                }));

                setChartData(formattedChartData);

                // 4. Calculate Trends (Simple current month vs last month)
                const now = new Date();
                const currentMonthName = months[now.getMonth()];
                now.setMonth(now.getMonth() - 1);
                const lastMonthName = months[now.getMonth()];

                const curRevenue = monthBuckets[currentMonthName]?.sales || 0;
                const prevRevenue = monthBuckets[lastMonthName]?.sales || 0;
                const revTrend = prevRevenue === 0 ? '+100%' : `${(((curRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)}%`;

                setStats({
                    totalSales: uniqueCustomers,
                    ordersCount: uniqueOrders,
                    productsCount: prodsCount || 0,
                    revenue: revenue,
                    trends: {
                        revenue: revTrend.startsWith('-') ? revTrend : `+${revTrend}`,
                        orders: '+0%', // Simplified for now
                        products: 'Stable',
                        customers: '+0%'
                    }
                });
            } catch (err) {
                console.error('Error fetching vendor stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    const statCards = [
        { label: locale === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue', value: `${stats.revenue} دج`, icon: <FiCreditCard />, color: '#6366F1', trend: stats.trends.revenue },
        { label: locale === 'ar' ? 'الطلبات' : 'Orders', value: stats.ordersCount, icon: <FiShoppingBag />, color: '#10B981', trend: stats.trends.orders },
        { label: locale === 'ar' ? 'المنتجات' : 'Products', value: stats.productsCount, icon: <FiTrendingUp />, color: '#F59E0B', trend: stats.trends.products },
        { label: locale === 'ar' ? 'العملاء' : 'Customers', value: stats.totalSales, icon: <FiUsers />, color: '#3B82F6', trend: stats.trends.customers },
    ];

    return (
        <div className="vendor-overview animate-fade">
            <div className="vendor-overview__grid">
                {statCards.map((card, idx) => (
                    <div key={idx} className="stat-card" style={{ '--accent': card.color }}>
                        <div className="stat-card__icon">{card.icon}</div>
                        <div className="stat-card__content">
                            <span className="stat-card__label">{card.label}</span>
                            <h3 className="stat-card__value">{card.value}</h3>
                        </div>
                        <div className="stat-card__trend">
                            {card.trend.includes('+') ? <FiArrowUpRight color="#10B981" /> : <FiArrowDownRight color="#6366F1" />}
                            <span>{card.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="vendor-overview__charts">
                <div className="chart-card">
                    <div className="chart-card__header">
                        <h3>{locale === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}</h3>
                        <span>{locale === 'ar' ? 'آخر 7 أشهر' : 'Last 7 Months'}</span>
                    </div>
                    <div className="chart-container" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#fff' }}
                                    cursor={{ stroke: '#6366F1', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-card__header">
                        <h3>{locale === 'ar' ? 'إحصائيات الطلبات' : 'Orders Statistics'}</h3>
                    </div>
                    <div className="chart-container" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#fff' }}
                                />
                                <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
