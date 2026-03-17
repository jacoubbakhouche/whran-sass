-- ==============================================================================
-- FIX: Institution Messages Delivery to Client
-- Update the SELECT policy to allow clients to see replies in their threads.
-- ==============================================================================

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view their own messages" ON public.institution_messages;

-- Create the refined policy
-- 1. Sender can see their own messages.
-- 2. Institution owner can see all messages for their institution.
-- 3. Thread starter (sender of the root message) can see all replies in the thread.
CREATE POLICY "Users can view their own messages"
ON public.institution_messages FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid() OR 
    institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid()) OR
    reply_to IN (SELECT id FROM public.institution_messages WHERE sender_id = auth.uid() AND reply_to IS NULL)
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
