-- Migration: Add missing leave request fields
-- This adds supervisor, reliever, handover, and contact fields to the leaves table

ALTER TABLE leaves
ADD COLUMN leave_period VARCHAR(50) DEFAULT 'full_day' AFTER reason,
ADD COLUMN selected_supervisor_id INT NULL AFTER leave_period,
ADD COLUMN covering_employee_id INT NULL AFTER selected_supervisor_id,
ADD COLUMN handover_notes LONGTEXT NULL AFTER covering_employee_id,
ADD COLUMN emergency_contact VARCHAR(20) NULL AFTER handover_notes,
ADD COLUMN alternative_email VARCHAR(255) NULL AFTER emergency_contact,
ADD COLUMN rejection_reason LONGTEXT NULL AFTER alternative_email;
