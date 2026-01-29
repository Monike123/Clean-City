-- Utility function to convert base64 data URI to bytea for display
-- This helps convert stored bytea back to displayable format

-- Example: If media_file is stored as bytea (hex format \x...)
-- We need to convert it back to base64 for web/mobile display

-- Check current media_file type
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'reports' 
AND column_name = 'media_file';

-- If media_file is TEXT and contains data URIs, images should work directly
-- If media_file is BYTEA, we need conversion

-- To display in web: Convert bytea to base64
-- SELECT encode(media_file, 'base64') as media_base64 FROM reports;

-- OR change column to TEXT if storing data URIs
-- ALTER TABLE reports ALTER COLUMN media_file TYPE TEXT;
