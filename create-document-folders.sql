-- Create default folders for Document Hub
INSERT INTO hr_folders (id, name, parent_folder_id, created_at, updated_at) VALUES
(UUID(), 'Employee Contracts', NULL, NOW(), NOW()),
(UUID(), 'Company Policies', NULL, NOW(), NOW()),
(UUID(), 'Performance Reviews', NULL, NOW(), NOW()),
(UUID(), 'Onboarding Documents', NULL, NOW(), NOW()),
(UUID(), 'Memos & Announcements', NULL, NOW(), NOW()),
(UUID(), 'Templates', NULL, NOW(), NOW());

-- Get the ID of 'Onboarding Documents' folder
SET @onboarding_folder_id = (SELECT id FROM hr_folders WHERE name = 'Onboarding Documents' LIMIT 1);

-- Update onboarding documents to have folder_id reference
-- First, we need to add a folder_id column to onboardings table if it doesn't exist
-- ALTER TABLE onboardings ADD COLUMN folder_id CHAR(36) NULL;

-- For now, we'll create hr_documents entries from onboarding documents
-- and assign them to the Onboarding Documents folder
INSERT INTO hr_documents (id, name, file_url, document_type, folder_id, access_level, created_by, created_at, updated_at)
SELECT 
    CONCAT('onboarding_', o.id),
    o.document_name,
    o.document_url,
    LOWER(REPLACE(o.document_type, ' ', '_')),
    @onboarding_folder_id,
    'public',
    'system',
    o.submitted_at,
    NOW()
FROM onboardings o
WHERE o.status = 'submitted'
AND NOT EXISTS (
    SELECT 1 FROM hr_documents 
    WHERE id = CONCAT('onboarding_', o.id)
);

-- Verify the data
SELECT 
    f.name AS folder_name,
    COUNT(d.id) AS document_count
FROM hr_folders f
LEFT JOIN hr_documents d ON f.id = d.folder_id
GROUP BY f.id, f.name
ORDER BY f.created_at ASC;

SELECT 'Total folders created' as info, COUNT(*) as count FROM hr_folders;
SELECT 'Total documents in folders' as info, COUNT(*) as count FROM hr_documents WHERE folder_id IS NOT NULL;
