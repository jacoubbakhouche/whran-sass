-- ==============================================================================
-- FIX: Institution Messages Delivery & Security (Robust Version)
-- 1. Add recipient_id to explicitly track who the message is for.
-- 2. Simplified RLS policies to avoid recursion.
-- ==============================================================================

-- 1. Add the recipient_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='institution_messages' AND column_name='recipient_id') THEN
        ALTER TABLE public.institution_messages ADD COLUMN recipient_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Update existing messages to populate recipient_id for continuity
-- Root messages: recipient is the institution owner
UPDATE public.institution_messages m
SET recipient_id = i.owner_id
FROM public.institutions i
WHERE m.institution_id = i.id AND m.reply_to IS NULL AND m.recipient_id IS NULL;

-- Replies: recipient is the thread starter (sender of the root message)
-- Note: This assumes reply_to points to the root.
UPDATE public.institution_messages m
SET recipient_id = root.sender_id
FROM public.institution_messages root
WHERE m.reply_to = root.id AND m.recipient_id IS NULL;

-- 3. Drop old policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.institution_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.institution_messages;
DROP POLICY IF EXISTS "Institutions can reply" ON public.institution_messages;
DROP POLICY IF EXISTS "Institutions can update message status" ON public.institution_messages;

-- 4. Create Refined, Non-Recursive Policies

-- [SELECT] Users can see messages they sent or received, and institution owners see all for their inst.
CREATE POLICY "Users can view their own messages"
ON public.institution_messages FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
);

-- [INSERT] Anyone authenticated can send (logic handled by app)
CREATE POLICY "Users can send messages"
ON public.institution_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- [UPDATE] Institution owners can mark as read
CREATE POLICY "Institutions can update message status"
ON public.institution_messages FOR UPDATE
TO authenticated
USING (institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid()));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
