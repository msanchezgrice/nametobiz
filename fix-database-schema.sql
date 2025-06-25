-- Fix database schema for Phase 7
-- This addresses the "Could not find the 'bundle_key' column" error

-- First, let's check if the bundles table exists and what columns it has
-- You can run this in your Supabase SQL Editor

-- Add missing columns to bundles table if they don't exist
ALTER TABLE bundles 
ADD COLUMN IF NOT EXISTS bundle_key text,
ADD COLUMN IF NOT EXISTS preview_url text;

-- Make sure bundle_key is not null for existing records
UPDATE bundles 
SET bundle_key = CONCAT('bundles/', job_id, '/', domain, '/', theme_name)
WHERE bundle_key IS NULL;

-- Make sure preview_url is not null for existing records  
UPDATE bundles 
SET preview_url = CONCAT('https://nametobiz-static-delivery.doodad.workers.dev/site/', bundle_key, '/index.html')
WHERE preview_url IS NULL;

-- Add NOT NULL constraints
ALTER TABLE bundles 
ALTER COLUMN bundle_key SET NOT NULL,
ALTER COLUMN preview_url SET NOT NULL;

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bundles' 
ORDER BY ordinal_position; 