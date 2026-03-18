import { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { INSTITUTION_TYPES } from '../../lib/mockData';
import { FiSearch, FiEye, FiCheck, FiX, FiEdit, FiTrash2, FiFilter, FiClock } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { seedTestData } from '../../utils/seedData';
import './InstitutionManagement.css';

export default function InstitutionManagement() {
    const { t, locale, dir, getField } = useI18n();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        fetchInstitutions();
    }, []);

    const resolveTypeInfo = (type) =>
        INSTITUTION_TYPES.find(t => t.value === type || t.name_ar === type || t.name_fr === type) || INSTITUTION_TYPES[0];

    const fetchInstitutions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_admin_registration_list');
            
            if (error) throw error;

            // Map RPC results to list
            const mergedList = data?.map(item => ({
                id: item.institution_id || `profile-${item.profile_id}`,
                owner_id: item.profile_id,
                name_ar: item.name_ar || item.full_name,
                name_fr: item.name_fr || item.full_name,
                type: item.type || item.profile_role,
                status: item.institution_status || item.profile_status,
                created_at: item.created_at,
                is_profile_only: item.is_profile_only,
                full_name: item.full_name,
                email: item.email
            })) || [];

            setInstitutions(mergedList);
        } catch (err) {
            console.error('Error fetching data via RPC:', err);
            // Fallback to previous logic if RPC doesn't exist yet (for smooth transition)
            try {
                const { data: profData } = await supabase.from('profiles').select('*').in('role', ['institution', 'seller']);
                if (profData) setInstitutions(profData.map(p => ({
                    id: `profile-${p.id}`,
                    owner_id: p.id,
                    name_ar: p.full_name,
                    status: p.status,
                    is_profile_only: true
                })));
            } catch (inner) {}
        } finally {
            setLoading(false);
        }
    };

    const [modal, setModal] = useState(null); // { type: 'approve' | 'reject' | 'view', institution }

    const filtered = useMemo(() => {
        let results = [...institutions];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            results = results.filter(inst =>
                inst.name_ar?.toLowerCase().includes(q) || inst.name_fr?.toLowerCase().includes(q)
            );
        }
        if (statusFilter) {
            if (statusFilter === 'new_requests') {
                results = results.filter(inst => inst.status === 'pending' || inst.status === 'submitted');
            } else {
                results = results.filter(inst => inst.status === statusFilter);
            }
        }
        return results;
    }, [institutions, searchQuery, statusFilter]);

    const handleUpdateStatus = async (id, newStatus, reason = null, isProfileOnly = false) => {
        try {
            const table = isProfileOnly ? 'profiles' : 'institutions';
            const updateData = { status: newStatus };
            if (reason) {
                if (isProfileOnly) updateData.full_name = updateData.full_name; // No-op
                else updateData.rejection_reason = reason;
            }
            if (newStatus === 'active' && !isProfileOnly) updateData.verified = true;

            const { error } = await supabase
                .from(table)
                .update(updateData)
                .eq('id', id);
            
            if (error) throw error;
            
            // Re-fetch to ensure sync
            fetchInstitutions();
            setModal(null);
            
            if (newStatus === 'active') {
                alert(locale === 'ar' ? 'تم التفعيل بنجاح!' : 'Activé avec succès !');
            }
        } catch (err) {
            console.error(`Error updating status to ${newStatus}:`, err);
            alert(err.message);
        }
    };

    const handleSeed = async () => {
        if (!window.confirm(locale === 'ar' ? 'هل تريد توليد بيانات تجريبية؟' : 'Voulez-vous générer des données de test ?')) return;
        setSeeding(true);
        const result = await seedTestData();
        setSeeding(false);
        if (result.success) {
            alert(locale === 'ar' ? 'تم توليد البيانات بنجاح!' : 'Données générées !');
            fetchInstitutions();
        } else {
            alert(result.error);
        }
    };

    const handleReject = (institution) => {
        const reason = prompt(locale === 'ar' ? 'سبب الرفض:' : 'Raison du refus:');
        if (reason) handleUpdateStatus(institution.owner_id || institution.id, 'rejected', reason, institution.is_profile_only);
    };

    const handleRequestEdits = (institution) => {
        const note = prompt(locale === 'ar' ? 'ما الذي يحتاج لتعديل؟' : 'Que faut-il modifier ?');
        if (note) handleUpdateStatus(institution.owner_id || institution.id, 'pending', note, institution.is_profile_only);
    };

    const statusBadge = (status, isProfileOnly) => {
        if (isProfileOnly && status === 'pending') {
            return <span className="badge badge--pending">{locale === 'ar' ? 'بانتظار الإعداد' : 'En attente d\'infos'}</span>;
        }
        const map = {
            active: { label: locale === 'ar' ? 'نشط' : 'Actif', className: 'badge--approved' },
            approved: { label: t('approved'), className: 'badge--approved' },
            pending: { label: t('pending'), className: 'badge--pending' },
            submitted: { label: locale === 'ar' ? 'بانتظار المراجعة' : 'À examiner', className: 'badge--pending' },
            rejected: { label: t('rejected'), className: 'badge--rejected' },
        };
        const info = map[status] || map.pending;
        return <span className={`badge ${info.className}`}>{info.label}</span>;
    };

    const counts = {
        all: institutions.length,
        approved: institutions.filter(i => i.status === 'active' || i.status === 'approved').length,
        submitted: institutions.filter(i => i.status === 'submitted' || i.status === 'pending').length,
        under_review: institutions.filter(i => i.status === 'under_review').length,
        rejected: institutions.filter(i => i.status === 'rejected').length,
    };

    return (
        <div className="inst-mgmt" dir={dir}>
            <header className="inst-mgmt__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="inst-mgmt__title" style={{ margin: 0 }}>{t('institutionManagement')}</h1>
                <button 
                    className="btn-seed" 
                    onClick={handleSeed} 
                    disabled={seeding}
                    style={{
                        padding: '8px 16px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        opacity: seeding ? 0.7 : 1
                    }}
                >
                    {seeding ? '...' : (locale === 'ar' ? 'توليد بيانات تجريبية' : 'Générer Data')}
                </button>
            </header>

            {/* Status Tabs */}
            <div className="inst-mgmt__tabs">
                <button
                    className={`inst-tab ${statusFilter === '' ? 'inst-tab--active' : ''}`}
                    onClick={() => setStatusFilter('')}
                >
                    {locale === 'ar' ? 'الكل' : 'Tous'} <span className="inst-tab__count">{counts.all}</span>
                </button>
                <button
                    className={`inst-tab ${statusFilter === 'approved' ? 'inst-tab--active' : ''}`}
                    onClick={() => setStatusFilter('approved')}
                >
                    {t('approved')} <span className="inst-tab__count">{counts.approved}</span>
                </button>
                <button
                    className={`inst-tab ${statusFilter === 'new_requests' ? 'inst-tab--active' : ''}`}
                    onClick={() => setStatusFilter('new_requests')}
                >
                    {locale === 'ar' ? 'طلبات جديدة' : 'Nouveaux'} <span className="inst-tab__count inst-tab__count--warning">{counts.submitted}</span>
                </button>
                <button
                    className={`inst-tab ${statusFilter === 'under_review' ? 'inst-tab--active' : ''}`}
                    onClick={() => setStatusFilter('under_review')}
                >
                    {locale === 'ar' ? 'قيد المراجعة' : 'En examen'} <span className="inst-tab__count">{counts.under_review}</span>
                </button>
                <button
                    className={`inst-tab ${statusFilter === 'active' ? 'inst-tab--active' : ''}`}
                    onClick={() => setStatusFilter('active')}
                >
                    {locale === 'ar' ? 'نشط' : 'Actif'} <span className="inst-tab__count">{counts.approved}</span>
                </button>
                <button
                    className={`inst-tab ${statusFilter === 'rejected' ? 'inst-tab--active' : ''}`}
                    onClick={() => setStatusFilter('rejected')}
                >
                    {t('rejected')} <span className="inst-tab__count">{counts.rejected}</span>
                </button>
            </div>

            {/* Search */}
            <div className="inst-mgmt__search">
                <FiSearch size={16} />
                <input
                    type="text"
                    placeholder={locale === 'ar' ? 'بحث عن مؤسسة...' : 'Rechercher un établissement...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="inst-table-wrap">
                <table className="inst-table">
                    <thead>
                        <tr>
                            <th>{locale === 'ar' ? 'المؤسسة' : 'Établissement'}</th>
                            <th>{locale === 'ar' ? 'النوع' : 'Type'}</th>
                            <th>{locale === 'ar' ? 'الولاية' : 'Wilaya'}</th>
                            <th>{t('status')}</th>
                            <th>{locale === 'ar' ? 'التقييم' : 'Note'}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(inst => {
                            const typeInfo = resolveTypeInfo(inst.type);
                            const typeLabel = typeInfo ? getField(typeInfo, 'name') : inst.type;
                            const isProfile = inst.is_profile_only;
                            
                            return (
                                <tr key={inst.id} className={isProfile ? 'row--profile-only' : ''}>
                                    <td>
                                        <div className="inst-table__name-cell">
                                            <span className="inst-table__icon">{isProfile ? '👤' : (typeInfo?.icon || '🏢')}</span>
                                            <div>
                                                <span className="inst-table__name">{getField(inst, 'name')} {isProfile && <small style={{ opacity: 0.6 }}>({locale === 'ar' ? 'ملف جديد' : 'Nouveau'})</small>}</span>
                                                <span className="inst-table__city">{inst.commune || (isProfile ? (locale === 'ar' ? 'بانتظار المعلومات' : 'Attente infos') : '')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="inst-table__type" style={{ color: isProfile ? 'var(--primary)' : typeInfo?.color }}>
                                            {typeLabel || inst.type}
                                        </span>
                                    </td>
                                    <td>{inst.wilayas ? getField(inst.wilayas, 'name') : '-'}</td>
                                    <td>{statusBadge(inst.status, isProfile)}</td>
                                    <td>
                                        <span className="inst-table__rating">⭐ {inst.rating_avg || 0}</span>
                                    </td>
                                    <td>
                                        <div className="inst-table__actions">
                                            <button
                                                className="action-btn action-btn--view"
                                                onClick={() => setModal({ type: 'view', institution: inst })}
                                                title={t('view')}
                                            >
                                                <FiEye size={15} />
                                            </button>
                                            {(inst.status !== 'active') && (
                                                <button
                                                    className="action-btn action-btn--approve"
                                                    onClick={() => handleUpdateStatus(inst.owner_id || inst.id, 'active', null, isProfile)}
                                                    title={t('approve')}
                                                >
                                                    <FiCheck size={15} />
                                                </button>
                                            )}
                                            {!isProfile && inst.status === 'submitted' && (
                                                <button
                                                    className="action-btn action-btn--review"
                                                    onClick={() => handleUpdateStatus(inst.id, 'under_review')}
                                                    title={locale === 'ar' ? 'بدء المراجعة' : 'Examiner'}
                                                    style={{ color: '#6366F1' }}
                                                >
                                                    <FiEdit size={15} />
                                                </button>
                                            )}
                                            {isProfile && (
                                                <button
                                                    className="action-btn"
                                                    style={{ color: 'var(--primary)' }}
                                                    onClick={() => {
                                                        alert(locale === 'ar' ? 'هذا المستخدم لم يكمل بيانات المؤسسة بعد.' : 'Cet utilisateur n\'a pas encore rempli les informations de l\'établissement.');
                                                    }}
                                                    title={locale === 'ar' ? 'بانتظار البيانات' : 'Attente données'}
                                                >
                                                    <FiClock size={15} />
                                                </button>
                                            )}
                                            {(inst.status === 'submitted' || inst.status === 'under_review') && (
                                                <button
                                                    className="action-btn action-btn--edit"
                                                    onClick={() => {
                                                        const note = prompt(locale === 'ar' ? 'ما المعلومات الناقصة؟' : 'Infos manquantes ?');
                                                        if (note) handleUpdateStatus(inst.owner_id || inst.id, 'info_requested', note, isProfile);
                                                    }}
                                                    title={locale === 'ar' ? 'طلب معلومات' : 'Infos requises'}
                                                    style={{ color: '#F59E0B' }}
                                                >
                                                    <FiSearch size={15} />
                                                </button>
                                            )}
                                            {inst.status !== 'rejected' && inst.status !== 'active' && (
                                                <button
                                                    className="action-btn action-btn--reject"
                                                    onClick={() => handleReject(inst)}
                                                    title={t('reject')}
                                                >
                                                    <FiX size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            {modal?.type === 'view' && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h3>{getField(modal.institution, 'name')}</h3>
                            <button className="modal__close" onClick={() => setModal(null)}><FiX size={20} /></button>
                        </div>
                        <div className="modal__body">
                            <div className="modal__field">
                                <label>{t('address')}</label>
                                <p>{getField(modal.institution, 'address')}</p>
                            </div>
                            <div className="modal__field">
                                <label>{t('phone')}</label>
                                <p>{modal.institution.phone}</p>
                            </div>
                            <div className="modal__field">
                                <label>{t('email')}</label>
                                <p>{modal.institution.email}</p>
                            </div>
                            <div className="modal__field">
                                <label>{locale === 'ar' ? 'الوصف' : 'Description'}</label>
                                <p>{getField(modal.institution, 'description')}</p>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="modal__btn modal__btn--approve" onClick={() => handleUpdateStatus(modal.institution.id, 'active')}>
                                <FiCheck size={16} /> {t('approve')}
                            </button>
                            <button className="modal__btn modal__btn--edit" onClick={() => handleRequestEdits(modal.institution)}>
                                <FiEdit size={16} /> {locale === 'ar' ? 'طلب تعديل' : 'Demander modifs'}
                            </button>
                            <button className="modal__btn modal__btn--reject" onClick={() => handleReject(modal.institution)}>
                                <FiX size={16} /> {t('reject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
