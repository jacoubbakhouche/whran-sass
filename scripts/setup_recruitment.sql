# recruitment_ads table
CREATE TABLE IF NOT EXISTS public.recruitment_ads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    description_ar TEXT,
    description_fr TEXT,
    wilaya TEXT NOT NULL,
    job_type TEXT NOT NULL CHECK (job_type IN ('teacher','admin','counselor','supervisor','technician','other')),
    experience_level TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تسريع التصفية حسب الولاية ونوع الوظيفة
CREATE INDEX IF NOT EXISTS idx_recruitment_ads_wilaya ON public.recruitment_ads (wilaya);
CREATE INDEX IF NOT EXISTS idx_recruitment_ads_job_type ON public.recruitment_ads (job_type);

-- RLS
ALTER TABLE public.recruitment_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on active recruitment_ads" 
ON public.recruitment_ads FOR SELECT 
USING (status = 'active');

CREATE POLICY "Allow owners to manage their recruitment_ads"
ON public.recruitment_ads FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.institutions i 
        WHERE i.id = public.recruitment_ads.institution_id 
        AND i.owner_id = auth.uid()
    )
);
