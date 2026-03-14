import { supabase } from '../lib/supabase';

export const seedTestData = async () => {
    try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        console.log('Starting seed process...');

        // 2. Seed Institutions
        const institutions = [
            {
                id: 'e1111111-1111-1111-1111-111111111111',
                owner_id: user.id,
                name_ar: 'مدرسة النخبة العالمية',
                name_fr: 'Elite International School',
                type: 'primary', // Fixed enum value
                wilaya: 'الجزائر',
                commune: 'الأبيار',
                address_detail: '12 شارع الإخوة بوعدو، الأبيار',
                phone: '021 00 11 22',
                email: 'contact@elite-school.dz',
                status: 'active',
                description: 'مدرسة رائدة توفر تعليمًا عصريًا ببرامج دولية متميزة.'
            },
            {
                id: 'e2222222-2222-2222-2222-222222222222',
                owner_id: user.id,
                name_ar: 'مركز التدريب التقني',
                name_fr: 'Tech Training Center',
                type: 'training',
                wilaya: 'وهران',
                commune: 'بير الجير',
                address_detail: 'حي الياسمين، وهران',
                phone: '041 55 66 77',
                email: 'info@tech-center.dz',
                status: 'active',
                description: 'نخبة من الأساتذة والخبراء لتدريب الشباب على أحدث التقنيات.'
            }
        ];

        for (const inst of institutions) {
            const { error: instError } = await supabase
                .from('institutions')
                .upsert(inst, { onConflict: 'id' });
            if (instError) console.error('Error seeding institution:', instError);
        }

        // 3. Seed Services
        const services = [
            {
                institution_id: 'e1111111-1111-1111-1111-111111111111',
                programs: 'ابتدائي، متوسط، ثانوي (لغات، علوم)',
                fee_range: '180,000 - 350,000',
                has_transport: true,
                has_canteen: true,
                is_enrollment_open: true
            },
            {
                institution_id: 'e2222222-2222-2222-2222-222222222222',
                programs: 'برمجة، تصميم جرافيك، لغات حية',
                fee_range: '15,000 - 45,000',
                has_transport: false,
                has_canteen: false,
                is_enrollment_open: true
            }
        ];

        for (const serv of services) {
            const { error: servError } = await supabase
                .from('institution_services')
                .upsert(serv, { onConflict: 'institution_id' });
            if (servError) console.error('Error seeding service:', servError);
        }

        // 4. Seed Announcements
        const announcements = [
            {
                institution_id: 'e1111111-1111-1111-1111-111111111111',
                title_ar: 'بدء التسجيلات للسنة الدراسية 2026/2027',
                title_fr: 'Inscriptions Ouvertes 2026/2027',
                content_ar: 'يسرنا أن نعلن لأولياء الأمور عن بدء استقبال ملفات التسجيل لجميع الأطوار التعليمية من السنة الأولى ابتدائي إلى الثالثة ثانوي.',
                content_fr: 'Nous avons le plaisir d\'annoncer l\'ouverture des inscriptions pour tous les niveaux scolaires.'
            },
            {
                institution_id: 'e2222222-2222-2222-2222-222222222222',
                title_ar: 'دورة تدريبية في تطوير تطبيقات الويب',
                title_fr: 'Nouveau cours: Web Development',
                content_ar: 'انطلاق دورة مكثفة لتعلم React و Node.js ابتداءً من الشهر القادم. المقاعد محدودة!',
                content_fr: 'Lancement d\'une formation intensive en React et Node.js le mois prochain. Places limitées !'
            }
        ];

        const { error: annError } = await supabase
            .from('announcements')
            .upsert(announcements, { onConflict: 'title_ar, institution_id' }); // Assuming title+inst unique enough for test data
        if (annError) console.error('Error seeding announcements:', annError);

        // 5. Seed Products
        const products = [
            {
                name: 'الرياضيات الممتعة - السنة الأولى ابتدائي',
                author: 'أ. سليم منصوري',
                price: 850,
                discount_price: 790,
                status: 'active',
                description: 'كتاب تفاعلي متميز لتبسيط الرياضيات للأطفال بطرق حديثة ومبسطة.',
                stock_quantity: 120
            },
            {
                name: 'الطريق إلى النجاح في البكالوريا - فيزياء',
                author: 'أ. كمال بن علي',
                price: 1200,
                status: 'active',
                description: 'شرح وافٍ لجميع دروس الفيزياء مع تمارين محلولة ونماذج اختبارات سابقة.',
                stock_quantity: 85
            }
        ];

        for (const prod of products) {
            await supabase.from('products').upsert(prod, { onConflict: 'name' });
        }

        console.log('Seed completed successfully!');
        return { success: true };
    } catch (err) {
        console.error('Seed error:', err);
        return { success: false, error: err.message };
    }
};
