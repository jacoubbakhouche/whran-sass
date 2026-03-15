-- Add store-specific fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- For existing sellers, initialize store_name with full_name if not set
UPDATE public.profiles 
SET store_name = full_name 
WHERE role = 'seller' AND (store_name IS NULL OR store_name = '');

COMMENT ON COLUMN public.profiles.store_name IS 'The professional name of the vendor store';
COMMENT ON COLUMN public.profiles.bio IS 'A brief description or biography of the store';
