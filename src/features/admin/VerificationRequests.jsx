import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';
import { INSTITUTION_TYPES } from '../../lib/mockData';
import { FiCheck, FiX, FiClock, FiUser, FiHome, FiAlertCircle } from 'react-icons/fi';

export default function VerificationRequests() {
    const { locale, dir, getField } = useI18n();
    const [institutions, setInstitutions] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('institutions');

    const resolveTypeInfo = (type) =>
        INSTITUTION_TYPES.find(t => t.value === type || t.name_ar === type || t.name_fr === type);

    useEffect(() => {
        // Initial fetch
        fetchRequests();

        // Live Feed: Real-time subscriptions
        const instSubscription = supabase
            .channel('inst-pending')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'institutions' }, () => fetchRequests())
            .subscribe();

        const sellersSubscription = supabase
            .channel('sellers-pending')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchRequests())
            .subscribe();

        return () => {
            supabase.removeChannel(instSubscription);
            supabase.removeChannel(sellersSubscription);
        };
    }, []);

    const fetchRequests = async () => {
        // We do NOT use supabase.auth.getSession() here as requested.
        // Direct queries for pending status.
        try {
            // Fetch pending institutions
            const { data: instData } = await supabase
                .from('institutions')
                .select('*')
                .eq('status', 'pending');
            setInstitutions(instData || []);

            // Fetch pending sellers
            const { data: sellerData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'seller')
                .eq('status', 'pending'); // Using status column as requested
            setSellers(sellerData || []);
        } catch (err) {
            console.error('Data Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (table, id, status) => {
        try {
            const { error } = await supabase
                .from(table)
                .update({ status })
                .eq('id', id);
            
            if (error) throw error;
            
            // Local state update (though real-time will also trigger)
            if (table === 'institutions') {
                setInstitutions(prev => prev.filter(i => i.id !== id));
            } else {
                setSellers(prev => prev.filter(s => s.id !== id));
            }
        } catch (err) {
            console.error('Update Error:', err);
            alert(locale === 'ar' ? 'فشلت العملية' : 'Action failed');
        }
    };

    if (loading) return <div className="admin-loading">Loading requests...</div>;

    return (
        <div className="verification-requests" dir={dir}>
            <div className="admin-header">
                <h1>{locale === 'ar' ? 'طلبات التحقق' : 'Verification Requests'}</h1>
                <p>{locale === 'ar' ? 'مراجعة وتفعيل حسابات المؤسسات والبائعين الجدد.' : 'Review and activate new institution and seller accounts.'}</p>
            </div>

            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'institutions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('institutions')}
                >
                    {locale === 'ar' ? 'المؤسسات' : 'Institutions'} 
                    <span className="count">{institutions.length}</span>
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'sellers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sellers')}
                >
                    {locale === 'ar' ? 'البائعين' : 'Sellers'} 
                    <span className="count">{sellers.length}</span>
                </button>
            </div>

            <div className="requests-content">
                {activeTab === 'institutions' ? (
                    <div className="requests-grid">
                        {institutions.length === 0 ? (
                            <div className="empty-state">
                                <FiCheck size={48} />
                                <p>{locale === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending institution requests'}</p>
                            </div>
                        ) : (
                            institutions.map(inst => (
                                <div key={inst.id} className="request-card">
                                    <div className="request-info">
                                        <div className="request-icon"><FiHome /></div>
                                        <div>
                                            <h3>{locale === 'ar' ? inst.name_ar : inst.name_fr}</h3>
                                            <p>{getField(resolveTypeInfo(inst.type), 'name') || inst.type} • {inst.wilaya}</p>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button className="btn-approve" onClick={() => handleAction('institutions', inst.id, 'active')}>
                                            <FiCheck /> {locale === 'ar' ? 'قبول' : 'Approve'}
                                        </button>
                                        <button className="btn-reject" onClick={() => handleAction('institutions', inst.id, 'rejected')}>
                                            <FiX /> {locale === 'ar' ? 'رفض' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="requests-grid">
                        {sellers.length === 0 ? (
                            <div className="empty-state">
                                <FiCheck size={48} />
                                <p>{locale === 'ar' ? 'لا توجد طلبات بائعين معلقة' : 'No pending seller requests'}</p>
                            </div>
                        ) : (
                            sellers.map(seller => (
                                <div key={seller.id} className="request-card">
                                    <div className="request-info">
                                        <div className="request-icon"><FiUser /></div>
                                        <div>
                                            <h3>{seller.full_name}</h3>
                                            <p>{seller.phone || 'No phone'} • {seller.wilaya || 'No wilaya'}</p>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button className="btn-approve" onClick={() => handleAction('profiles', seller.id, 'active')}>
                                            <FiCheck /> {locale === 'ar' ? 'تفعيل' : 'Verify'}
                                        </button>
                                        <button className="btn-reject" onClick={() => handleAction('profiles', seller.id, 'rejected')}>
                                            <FiX /> {locale === 'ar' ? 'تجاهل' : 'Ignore'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .verification-requests { padding: 1rem; }
                .admin-header { margin-bottom: 2rem; }
                .admin-header h1 { font-size: 1.8rem; color: #fff; margin-bottom: 0.5rem; }
                .admin-header p { color: rgba(255,255,255,0.6); }
                
                .admin-tabs { display: flex; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem; }
                .tab-btn { 
                    padding: 1rem 1.5rem; border: none; background: none; color: rgba(255,255,255,0.5); 
                    cursor: pointer; position: relative; font-weight: 500; font-size: 1rem;
                }
                .tab-btn.active { color: var(--accent); }
                .tab-btn.active::after { 
                    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; 
                    background: var(--accent); border-radius: 99px;
                }
                .tab-btn .count { 
                    margin-inline-start: 8px; background: rgba(255,255,255,0.1); 
                    padding: 2px 8px; border-radius: 99px; font-size: 0.8rem; 
                }
                
                .requests-grid { display: grid; gap: 1rem; }
                .request-card { 
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
                    border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;
                }
                .request-info { display: flex; align-items: center; gap: 1rem; }
                .request-icon { 
                    width: 48px; height: 48px; background: rgba(139, 92, 246, 0.1); 
                    color: var(--accent); border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    font-size: 1.2rem;
                }
                .request-info h3 { font-size: 1.1rem; color: #fff; margin-bottom: 4px; }
                .request-info p { font-size: 0.9rem; color: rgba(255,255,255,0.5); }
                
                .request-actions { display: flex; gap: 0.75rem; }
                .btn-approve, .btn-reject { 
                    display: flex; align-items: center; gap: 6px; padding: 8px 16px; 
                    border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s;
                }
                .btn-approve { background: #10b981; color: #fff; }
                .btn-approve:hover { background: #059669; }
                .btn-reject { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .btn-reject:hover { background: rgba(239, 68, 68, 0.2); }
                
                .empty-state { 
                    text-align: center; padding: 4rem 1rem; color: rgba(255,255,255,0.3);
                    display: flex; flexDirection: column; align-items: center; gap: 1rem;
                }
            ` }} />
        </div>
    );
}
