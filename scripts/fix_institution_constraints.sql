-- Fix for: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- 1. Ensure institutions table has a unique constraint on owner_id
-- We might need to delete duplicates if they exist (keep the latest one)
DELETE FROM institutions a USING institutions b
WHERE a.id < b.id AND a.owner_id = b.owner_id;

ALTER TABLE institutions 
ADD CONSTRAINT institutions_owner_id_key UNIQUE (owner_id);

-- 2. Ensure institution_services has a unique constraint on institution_id
DELETE FROM institution_services a USING institution_services b
WHERE a.id < b.id AND a.institution_id = b.institution_id;

ALTER TABLE institution_services 
ADD CONSTRAINT institution_services_institution_id_key UNIQUE (institution_id);
