import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiTrash2, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './CartScreen.css';

export default function CartScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchCart();
    }, [user, navigate]);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cart')
                .select(`
                    *,
                    products (*)
                `)
                .eq('user_id', user.id);
            
            if (error) throw error;
            setCartItems(data || []);
        } catch (err) {
            console.error('Error fetching cart:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (id) => {
        try {
            const { error } = await supabase
                .from('cart')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setCartItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Error removing item:', err);
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => {
            const price = item.products.discount_price || item.products.price || 0;
            return acc + (price * item.quantity);
        }, 0);
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;
        setProcessing(true);
        try {
            const total = calculateTotal();
            
            // 1. Create the Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total_amount: total,
                    status: 'pending'
                })
                .select()
                .single();
            
            if (orderError) throw orderError;

            // 2. Create Order Items & Update Stock
            for (const item of cartItems) {
                // Add order item
                await supabase.from('order_items').insert({
                    order_id: order.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.products.discount_price || item.products.price
                });

                // Deduct Stock
                const newStock = item.products.stock_quantity - item.quantity;
                await supabase
                    .from('products')
                    .update({ stock_quantity: Math.max(0, newStock) })
                    .eq('id', item.product_id);
                
                // Notify Seller (Mock logic for now - inserting into notifications table)
                await supabase.from('notifications').insert({
                    user_id: item.products.seller_id,
                    type: 'new_order',
                    title: 'طلب جديد! 📦',
                    message: `لقد وصلك طلب جديد للمنتج: ${item.products.name}`
                });
            }

            // 3. Clear Cart
            await supabase.from('cart').delete().eq('user_id', user.id);

            alert('تم تأكيد الطلب بنجاح! سيتم التواصل معك قريباً.');
            navigate('/profile'); // Or to an orders list
        } catch (err) {
            console.error('Checkout error:', err);
            alert('حدث خطأ أثناء إتمام الطلب: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="cart-page" dir="rtl">
            <header className="cart-header">
                <button className="icon-btn" onClick={() => navigate(-1)}>
                    <FiChevronLeft size={24} />
                </button>
                <h2>سلة المشتريات</h2>
                <div style={{ width: 24 }} />
            </header>

            <div className="cart-content">
                {loading ? (
                    <div className="cart-empty animate-up">
                        <p>جاري التحميل...</p>
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="cart-empty animate-up">
                        <div className="empty-icon">🛒</div>
                        <h3>سلتك فارغة</h3>
                        <p>تصفح المكتبة وأضف بعض الكتب المميزة!</p>
                        <button className="btn-primary" onClick={() => navigate('/store')}>تصفح الآن</button>
                    </div>
                ) : (
                    <>
                        <div className="cart-items-list animate-up">
                            {cartItems.map(item => (
                                <div key={item.id} className="cart-item-card">
                                    <div className="cart-item-img">
                                        {item.products.cover_url ? (
                                            <img src={supabase.storage.from('product-covers').getPublicUrl(item.products.cover_url).data.publicUrl} alt={item.products.name} />
                                        ) : <span>📚</span>}
                                    </div>
                                    <div className="cart-item-info">
                                        <h4>{item.products.name}</h4>
                                        <p className="item-price">{item.products.discount_price || item.products.price} دج</p>
                                    </div>
                                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                                        <FiTrash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary animate-up">
                            <div className="summary-row">
                                <span>المجموع</span>
                                <span>{calculateTotal()} دج</span>
                            </div>
                            <div className="summary-row">
                                <span>التوصيل</span>
                                <span className="free-tag">مجاني</span>
                            </div>
                            <div className="summary-total">
                                <span>الإجمالي</span>
                                <span>{calculateTotal()} دج</span>
                            </div>
                            <button 
                                className="btn-checkout" 
                                onClick={handleCheckout}
                                disabled={processing}
                            >
                                {processing ? 'جاري التأكيد...' : 'تأكيد الطلب الآن'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
