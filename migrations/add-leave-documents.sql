-- Migration: Add document support to leaves table
-- This adds JSON columns to store supporting and handover documents

ALTER TABLE leaves
ADD COLUMN supporting_documents LONGTEXT NULL AFTER rejection_reason,
ADD COLUMN handover_documents LONGTEXT NULL AFTER supporting_documents;
