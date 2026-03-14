import { createContext, useContext, useState, useCallback } from 'react';

const translations = {
    ar: {
        // App
        appName: 'إيدو إكسبيرت',
        appSlogan: 'ابحث عن مستقبلك التعليمي مع إيدو إكسبيرت',
        appDescription: 'منصة إيدو إكسبيرت للبحث عن المؤسسات التعليمية في الجزائر',

        // Navigation
        home: 'الرئيسية',
        search: 'البحث',
        about: 'حول المنصة',
        contact: 'اتصل بنا',
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب',
        admin: 'لوحة التحكم',
        logout: 'تسجيل الخروج',

        // Search
        searchPlaceholder: 'ابحث عن مدرسة، جامعة أو مركز تكوين...',
        searchButton: 'بحث',
        filters: 'التصفية',
        allTypes: 'جميع الأنواع',
        allWilayas: 'جميع الولايات',
        sortBy: 'ترتيب حسب',
        sortByRating: 'التقييم',
        sortByName: 'الاسم',
        sortByDistance: 'المسافة',
        results: 'نتيجة',
        noResults: 'لا توجد نتائج',
        noResultsDescription: 'جرب تغيير معايير البحث',

        // Institution
        viewProfile: 'عرض الملف',
        programs: 'البرامج والتخصصات',
        reviews: 'التقييمات',
        writeReview: 'أكتب تقييم',
        students: 'طالب',
        contactInfo: 'معلومات الاتصال',
        address: 'العنوان',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        website: 'الموقع الإلكتروني',
        similarInstitutions: 'مؤسسات مشابهة',
        openOnMap: 'عرض على الخريطة',
        sendMessage: 'إرسال رسالة',
        share: 'مشاركة',

        // Map
        mapView: 'عرض الخريطة',
        listView: 'عرض القائمة',
        satellite: 'القمر الصناعي',
        streets: 'الشوارع',
        myLocation: 'موقعي',

        // Categories
        kindergarten: 'روضة أطفال',
        primary: 'ابتدائية',
        middle: 'متوسطة',
        high: 'ثانوية',
        university: 'جامعة',
        vocational: 'تكوين مهني',
        private: 'مدرسة خاصة',
        quranic: 'مدرسة قرآنية',

        // Stats
        totalInstitutions: 'مؤسسة تعليمية',
        totalWilayas: 'ولاية',
        totalReviews: 'تقييم',
        totalUsers: 'مستخدم',

        // Admin
        dashboard: 'لوحة التحكم',
        institutionManagement: 'إدارة المؤسسات',
        userManagement: 'إدارة المستخدمين',
        statistics: 'الإحصائيات',
        settings: 'الإعدادات',
        pending: 'في الانتظار',
        approved: 'مقبول',
        rejected: 'مرفوض',
        approve: 'قبول',
        reject: 'رفض',
        delete: 'حذف',
        edit: 'تعديل',
        view: 'عرض',
        status: 'الحالة',
        actions: 'الإجراءات',
        totalPending: 'طلبات معلقة',
        approvedToday: 'تمت الموافقة اليوم',
        recentActivity: 'النشاط الأخير',
        overview: 'نظرة عامة',
        registrationsPerMonth: 'التسجيلات شهرياً',
        institutionsByType: 'المؤسسات حسب النوع',
        institutionsByWilaya: 'المؤسسات حسب الولاية',
        adminLogin: 'تسجيل دخول المشرف',
        adminPassword: 'كلمة المرور',

        // Common
        loading: 'جاري التحميل...',
        error: 'حدث خطأ',
        retry: 'إعادة المحاولة',
        cancel: 'إلغاء',
        save: 'حفظ',
        confirm: 'تأكيد',
        close: 'إغلاق',
        next: 'التالي',
        previous: 'السابق',
        showing: 'عرض',
        of: 'من',
        language: 'اللغة',
        arabic: 'العربية',
        french: 'الفرنسية',
    },
    fr: {
        appName: 'Edu-Expert',
        appSlogan: 'Trouvez votre avenir éducatif avec Edu-Expert',
        appDescription: 'Plateforme Edu-Expert de recherche d\'établissements éducatifs en Algérie',

        home: 'Accueil',
        search: 'Recherche',
        about: 'À propos',
        contact: 'Contact',
        login: 'Connexion',
        register: 'Inscription',
        admin: 'Tableau de bord',
        logout: 'Déconnexion',

        searchPlaceholder: 'Rechercher une école, université ou centre de formation...',
        searchButton: 'Rechercher',
        filters: 'Filtres',
        allTypes: 'Tous les types',
        allWilayas: 'Toutes les wilayas',
        sortBy: 'Trier par',
        sortByRating: 'Note',
        sortByName: 'Nom',
        sortByDistance: 'Distance',
        results: 'résultat(s)',
        noResults: 'Aucun résultat',
        noResultsDescription: 'Essayez de modifier vos critères de recherche',

        viewProfile: 'Voir le profil',
        programs: 'Programmes et spécialités',
        reviews: 'Avis',
        writeReview: 'Écrire un avis',
        students: 'étudiants',
        contactInfo: 'Coordonnées',
        address: 'Adresse',
        phone: 'Téléphone',
        email: 'E-mail',
        website: 'Site web',
        similarInstitutions: 'Établissements similaires',
        openOnMap: 'Voir sur la carte',
        sendMessage: 'Envoyer un message',
        share: 'Partager',

        mapView: 'Vue carte',
        listView: 'Vue liste',
        satellite: 'Satellite',
        streets: 'Rues',
        myLocation: 'Ma position',

        kindergarten: 'Crèche',
        primary: 'Primaire',
        middle: 'CEM',
        high: 'Lycée',
        university: 'Université',
        vocational: 'Formation Pro.',
        private: 'École Privée',
        quranic: 'École Coranique',

        totalInstitutions: 'établissements',
        totalWilayas: 'wilayas',
        totalReviews: 'avis',
        totalUsers: 'utilisateurs',

        dashboard: 'Tableau de bord',
        institutionManagement: 'Gestion des établissements',
        userManagement: 'Gestion des utilisateurs',
        statistics: 'Statistiques',
        settings: 'Paramètres',
        pending: 'En attente',
        approved: 'Approuvé',
        rejected: 'Rejeté',
        approve: 'Approuver',
        reject: 'Rejeter',
        delete: 'Supprimer',
        edit: 'Modifier',
        view: 'Voir',
        status: 'Statut',
        actions: 'Actions',
        totalPending: 'Demandes en attente',
        approvedToday: 'Approuvés aujourd\'hui',
        recentActivity: 'Activité récente',
        overview: 'Vue d\'ensemble',
        registrationsPerMonth: 'Inscriptions par mois',
        institutionsByType: 'Établissements par type',
        institutionsByWilaya: 'Établissements par wilaya',
        adminLogin: 'Connexion administrateur',
        adminPassword: 'Mot de passe',

        loading: 'Chargement...',
        error: 'Une erreur est survenue',
        retry: 'Réessayer',
        cancel: 'Annuler',
        save: 'Enregistrer',
        confirm: 'Confirmer',
        close: 'Fermer',
        next: 'Suivant',
        previous: 'Précédent',
        showing: 'Affichage',
        of: 'sur',
        language: 'Langue',
        arabic: 'Arabe',
        french: 'Français',
    }
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
    const [locale, setLocale] = useState('ar');

    const t = useCallback((key) => {
        return translations[locale]?.[key] || key;
    }, [locale]);

    const dir = locale === 'ar' ? 'rtl' : 'ltr';

    const toggleLocale = useCallback(() => {
        setLocale(prev => prev === 'ar' ? 'fr' : 'ar');
    }, []);

    const getField = useCallback((obj, field) => {
        if (!obj) return '';
        return obj[`${field}_${locale === 'ar' ? 'ar' : 'fr'}`] || obj[`${field}_ar`] || obj[field] || '';
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, dir, toggleLocale, getField }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) throw new Error('useI18n must be used within I18nProvider');
    return context;
}
