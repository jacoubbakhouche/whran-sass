import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiSearch } from 'react-icons/fi';
import './OrderManager.css';

export default function OrderManager() {
    const { locale, dir } = useI18n();
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchVendorOrders();
    }, [user]);

    const fetchVendorOrders = async () => {
        setLoading(true);
        try {
            // Fetch order_items for this seller
            const { data: vendorItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                    id, quantity, unit_price, total_price,
                    products!inner(id, name, seller_id, cover_url),
                    orders!inner(id, status, created_at, total_amount, buyer_id, profiles(full_name, phone))
                `)
                .eq('products.seller_id', user.id);
            
            if (itemsError) throw itemsError;

            // Group items by order
            const groupedOrders = vendorItems.reduce((acc, item) => {
                const orderId = item.orders.id;
                if (!acc[orderId]) {
                    acc[orderId] = {
                        ...item.orders,
                        items: []
                    };
                }
                acc[orderId].items.push(item);
                return acc;
            }, {});

            setOrders(Object.values(groupedOrders).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);
            
            if (error) throw error;
            
            // Send Notification to Buyer
            const order = orders.find(o => o.id === orderId);
            if (order) {
                await supabase.from('notifications').insert({
                    user_id: order.buyer_id, // Use buyer_id from order
                    type: 'order_update',
                    title: 'تحديث في حالة طلبك 📦',
                    message: `حالة طلبك رقم ${orderId.slice(0,8)} أصبحت الآن: ${newStatus}`
                });
            }

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const statusMap = {
        pending: { label: locale === 'ar' ? 'قيد الانتظار' : 'En attente', color: '#F59E0B', icon: <FiClock /> },
        confirmed: { label: locale === 'ar' ? 'تم التأكيد' : 'Confirmé', color: '#3B82F6', icon: <FiCheckCircle /> },
        shipped: { label: locale === 'ar' ? 'تم الشحن' : 'Expédié', color: '#6366F1', icon: <FiTruck /> },
        delivered: { label: locale === 'ar' ? 'تم التوصيل' : 'Livré', color: '#10B981', icon: <FiPackage /> },
        cancelled: { label: locale === 'ar' ? 'ملغي' : 'Annulé', color: '#EF4444', icon: <FiXCircle /> },
    };

    return (
        <div className="order-mgmt" dir={dir}>
            <div className="order-mgmt__header">
                <h1>{locale === 'ar' ? 'إدارة الطلبات' : 'Gestion des commandes'}</h1>
                <p>تابع مبيعاتك وحدث حالة الطلبات المرسلة إليك</p>
            </div>

            <div className="order-mgmt__toolbar">
                <div className="search-box">
                    <FiSearch />
                    <input 
                        placeholder={locale === 'ar' ? 'بحث برقم الطلب...' : 'Chercher par ID...'} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="orders-list">
                {loading ? (
                    <div className="loading-state">جاري التحميل...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">لا يوجد طلبات حالياً</div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="order-card animate-up">
                            <div className="order-card__header">
                                <div className="order-id">
                                    <span>#{order.id.slice(0, 8)}</span>
                                    <small>{new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}</small>
                                </div>
                                <div className="order-status" style={{ color: statusMap[order.status]?.color }}>
                                    {statusMap[order.status]?.icon}
                                    <span>{statusMap[order.status]?.label}</span>
                                </div>
                            </div>

                            <div className="order-customer">
                                <strong>{order.profiles?.full_name || 'عميل Edu-expert'}</strong>
                                <span>{order.profiles?.phone || ''}</span>
                            </div>

                            <div className="order-items">
                                {order.items.map(item => (
                                    <div key={item.id} className="order-item-row">
                                        <span>{item.products.name} (x{item.quantity})</span>
                                        <span>{item.total_price} دج</span>
                                    </div>
                                ))}
                            </div>

                            <div className="order-actions">
                                {order.status === 'pending' && (
                                    <button className="confirm-btn" onClick={() => updateStatus(order.id, 'confirmed')}>تأكيد الطلب</button>
                                )}
                                {order.status === 'confirmed' && (
                                    <button className="ship-btn" onClick={() => updateStatus(order.id, 'shipped')}>تم الشحن</button>
                                )}
                                {order.status === 'shipped' && (
                                    <button className="deliver-btn" onClick={() => updateStatus(order.id, 'delivered')}>تم التوصيل</button>
                                )}
                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                    <button className="cancel-btn" onClick={() => updateStatus(order.id, 'cancelled')}>إلغاء</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
