-- Verify Database Schema Fix
-- Run this in your Supabase SQL Editor to confirm everything is working

-- 1. Check bundles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bundles' 
ORDER BY ordinal_position;

-- 2. Count existing bundles
SELECT COUNT(*) as total_bundles FROM bundles;

-- 3. Check for any bundles missing the new columns
SELECT COUNT(*) as bundles_missing_bundle_key 
FROM bundles 
WHERE bundle_key IS NULL;

SELECT COUNT(*) as bundles_missing_preview_url 
FROM bundles 
WHERE preview_url IS NULL;

-- 4. Sample a few bundles to verify structure
SELECT id, domain, theme_name, bundle_key, preview_url, created_at 
FROM bundles 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Force refresh schema cache (this might help with the cache issue)
NOTIFY pgrst, 'reload schema'; 