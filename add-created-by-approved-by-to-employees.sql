-- Add created_by and approved_by columns to employees table
ALTER TABLE employees 
ADD COLUMN created_by INT AFTER nhf_applicable,
ADD COLUMN approved_by INT AFTER created_by,
ADD FOREIGN KEY (created_by) REFERENCES users(id),
ADD FOREIGN KEY (approved_by) REFERENCES users(id);
