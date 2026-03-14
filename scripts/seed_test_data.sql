-- ─────────────────────────────────────────────────────────────────────
-- SEED DATA FOR EDU-EXPERT PLATFORM
-- This script adds mock institutions, announcements, and books for testing.
-- ─────────────────────────────────────────────────────────────────────

-- 1. CLEANUP (Optional: Remove if you want to keep existing data)
-- DELETE FROM public.announcements;
-- DELETE FROM public.institution_services;
-- DELETE FROM public.institutions;
-- DELETE FROM public.products;

-- 2. SEED INSTITUTIONS
-- Note: Replace '00000000-0000-0000-0000-000000000000' with a real user UID from your 'profiles' table if needed.
-- Or just run this to create generic data linked to a system ID.

INSERT INTO public.institutions (id, owner_id, name_ar, name_fr, type, wilaya, commune, address_detail, phone, email, status, description)
VALUES 
(
  'e1111111-1111-1111-1111-111111111111', 
  auth.uid(), -- Links to the current user running the script
  'مدرسة النخبة العالمية', 
  'Elite International School', 
  'school', 
  'الجزائر', 
  'الأبيار', 
  '12 شارع الإخوة بوعدو، الأبيار', 
  '021 00 11 22', 
  'contact@elite-school.dz', 
  'active',
  'مدرسة رائدة توفر تعليمًا عصريًا ببرامج دولية متميزة.'
),
(
  'e2222222-2222-2222-2222-222222222222', 
  auth.uid(), 
  'مركز التدريب التقني', 
  'Tech Training Center', 
  'training', 
  'وهران', 
  'بير الجير', 
  'حي الياسمين، وهران', 
  '041 55 66 77', 
  'info@tech-center.dz', 
  'active',
  'نخبة من الأساتذة والخبراء لتدريب الشباب على أحدث التقنيات.'
);

-- 3. SEED SERVICES
INSERT INTO public.institution_services (institution_id, programs, fee_range, has_transport, has_canteen, is_enrollment_open)
VALUES 
(
  'e1111111-1111-1111-1111-111111111111', 
  'ابتدائي، متوسط، ثانوي (لغات، علوم)', 
  '180,000 - 350,000', 
  true, 
  true, 
  true
),
(
  'e2222222-2222-2222-2222-222222222222', 
  'برمجة، تصميم جرافيك، لغات حية', 
  '15,000 - 45,000', 
  false, 
  false, 
  true
);

-- 4. SEED ANNOUNCEMENTS
INSERT INTO public.announcements (institution_id, title_ar, title_fr, content_ar, content_fr)
VALUES 
(
  'e1111111-1111-1111-1111-111111111111', 
  'بدء التسجيلات للسنة الدراسية 2026/2027', 
  'Inscriptions Ouvertes 2026/2027', 
  'يسرنا أن نعلن لأولياء الأمور عن بدء استقبال ملفات التسجيل لجميع الأطوار التعليمية من السنة الأولى ابتدائي إلى الثالثة ثانوي.', 
  'Nous avons le plaisir d''annoncer l''ouverture des inscriptions pour tous les niveaux scolaires.'
),
(
  'e1111111-1111-1111-1111-111111111111', 
  'يوم مفتوح للتعريف بالمدرسة', 
  'Journée Portes Ouvertes', 
  'ندعوكم لحضور اليوم المفتوح يوم السبت القادم للتعرف على مرافق المدرسة والمنهج التعليمي المعتمد.', 
  'Rejoignez-nous samedi prochain pour découvrir nos installations et notre programme pédagogique.'
),
(
  'e2222222-2222-2222-2222-222222222222', 
  'دورة تدريبية في تطوير تطبيقات الويب', 
  'Nouveau cours: Web Development', 
  'انطلاق دورة مكثفة لتعلم React و Node.js ابتداءً من الشهر القادم. المقاعد محدودة!', 
  'Lancement d''une formation intensive en React et Node.js le mois prochain. Places limitées !'
);

-- 5. SEED PRODUCTS (BOOKS)
INSERT INTO public.products (name, author, price, discount_price, status, description, stock_quantity)
VALUES 
(
  'الرياضيات الممتعة - السنة الأولى ابتدائي', 
  'أ. سليم منصوري', 
  850, 
  790, 
  'active', 
  'كتاب تفاعلي متميز لتبسيط الرياضيات للأطفال بطرق حديثة ومبسطة.', 
  120
),
(
  'الطريق إلى النجاح في البكالوريا - فيزياء', 
  'أ. كمال بن علي', 
  1200, 
  null, 
  'active', 
  'شرح وافٍ لجميع دروس الفيزياء مع تمارين محلولة ونماذج اختبارات سابقة.', 
  85
),
(
  'رواية: عابر سبيل', 
  'للكاتبة مريم فرح', 
  1400, 
  1150, 
  'active', 
  'رواية أدبية معاصرة تأخذك في رحلة مشوقة عبر تاريخ وزوايا الجزائر الجميلة.', 
  45
),
(
  'تعلم الفرنسية بسهولة للمبتدئين', 
  'مركز اللغات الحديثة', 
  950, 
  null, 
  'active', 
  'منهج متكامل لتعلم أساسيات اللغة الفرنسية بأسلوب ميسر وشيق.', 
  200
);
