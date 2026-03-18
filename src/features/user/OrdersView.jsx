import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './OrdersView.css';

export default function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="orders-page page" dir="rtl">
      <header className="orders-header">
        <h2>طلباتي</h2>
        <p>أحدث الطلبات التي أرسلتها عبر المتجر.</p>
      </header>
      {loading ? (
        <div className="orders-empty">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          لم تقم بأي طلب بعد. تصفح المتجر لبدء الشراء.
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div>
                <strong>#{String(order.id).slice(0, 8).toUpperCase()}</strong>
                <div className="order-date">{new Date(order.created_at).toLocaleDateString()}</div>
              </div>
              <span className="order-status">{order.status || 'جاري المعالجة'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
