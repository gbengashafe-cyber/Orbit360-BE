-- Add asset_return_status column to exits table
ALTER TABLE exits ADD COLUMN asset_return_status ENUM('not_applicable', 'pending_return', 'returned', 'not_returned') DEFAULT 'pending_return' AFTER assets_to_return;
