-- Migration to add missing institution types to the institution_type enum
-- This fixes the "invalid input value for enum institution_type: 'middle'" error

-- Add values one by one. IF NOT EXISTS is supported in newer Postgres versions for ADD VALUE.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'institution_type' AND e.enumlabel = 'primary') THEN
        ALTER TYPE institution_type ADD VALUE 'primary';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'institution_type' AND e.enumlabel = 'middle') THEN
        ALTER TYPE institution_type ADD VALUE 'middle';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'institution_type' AND e.enumlabel = 'secondary') THEN
        ALTER TYPE institution_type ADD VALUE 'secondary';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'institution_type' AND e.enumlabel = 'university') THEN
        ALTER TYPE institution_type ADD VALUE 'university';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'institution_type' AND e.enumlabel = 'training') THEN
        ALTER TYPE institution_type ADD VALUE 'training';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Handle case where value might have been added between check and alter
        NULL;
END $$;
