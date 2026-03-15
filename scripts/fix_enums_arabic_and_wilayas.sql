-- المرحلة 1: إضافة القيم الجديدة (قم بتشغيل هذه المجموعة أولاً)
-- ─────────────────────────────────────────────────────────────────────

ALTER TYPE institution_type ADD VALUE IF NOT EXISTS 'مدرسة';
ALTER TYPE institution_type ADD VALUE IF NOT EXISTS 'ابتدائي';
ALTER TYPE institution_type ADD VALUE IF NOT EXISTS 'متوسط';
ALTER TYPE institution_type ADD VALUE IF NOT EXISTS 'ثانوي';
ALTER TYPE institution_type ADD VALUE IF NOT EXISTS 'جامعة';
ALTER TYPE institution_type ADD VALUE IF NOT EXISTS 'مركز تدريب';

DO $$
DECLARE
    i INT;
    code_str TEXT;
BEGIN
    FOR i IN 1..58 LOOP
        code_str := LPAD(i::TEXT, 2, '0');
        BEGIN
            EXECUTE format('ALTER TYPE wilaya_code ADD VALUE %L', code_str);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END LOOP;
END $$;

-- المرحلة 2: تحديث البيانات (قم بتشغيل هذه المجموعة بعد نجاح الأولى)
-- ─────────────────────────────────────────────────────────────────────

-- يجب مسح السكربت أعلاه وتشغيل هذا الجزء بشكل منفصل
-- UPDATE public.institutions SET type = 'مدرسة' WHERE type::text = 'school';
-- UPDATE public.institutions SET type = 'ابتدائي' WHERE type::text = 'primary';
-- UPDATE public.institutions SET type = 'متوسط' WHERE type::text = 'middle';
-- UPDATE public.institutions SET type = 'ثانوي' WHERE type::text = 'secondary';
-- UPDATE public.institutions SET type = 'جامعة' WHERE type::text = 'university';
-- UPDATE public.institutions SET type = 'مركز تدريب' WHERE type::text = 'training';
