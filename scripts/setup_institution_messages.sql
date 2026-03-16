-- ==============================================================================
-- SETUP: Institution Messages Table & RLS
-- Run this script in the Supabase SQL Editor
-- ==============================================================================

-- 1. Create the messages table
CREATE TABLE IF NOT EXISTS public.institution_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    reply_to UUID REFERENCES public.institution_messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inst_messages_institution_id ON public.institution_messages(institution_id);
CREATE INDEX IF NOT EXISTS idx_inst_messages_sender_id ON public.institution_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_inst_messages_created_at ON public.institution_messages(created_at);

-- 3. Row Level Security (RLS)
ALTER TABLE public.institution_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see messages they sent or received
DROP POLICY IF EXISTS "Users can view their own messages" ON public.institution_messages;
CREATE POLICY "Users can view their own messages"
ON public.institution_messages FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid() OR 
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
);

-- Policy: Users can send messages to institutions
DROP POLICY IF EXISTS "Users can send messages" ON public.institution_messages;
CREATE POLICY "Users can send messages"
ON public.institution_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Policy: Institutions can reply
DROP POLICY IF EXISTS "Institutions can reply" ON public.institution_messages;
CREATE POLICY "Institutions can reply"
ON public.institution_messages FOR INSERT
TO authenticated
WITH CHECK (
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid()) OR
    sender_id = auth.uid()
);

-- Policy: Institutions can update message status (e.g. mark as read)
DROP POLICY IF EXISTS "Institutions can update message status" ON public.institution_messages;
CREATE POLICY "Institutions can update message status"
ON public.institution_messages FOR UPDATE
TO authenticated
USING (institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid()));

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
