-- Fix Flyway: Remove failed V2 entry so it can re-run with corrected SQL
DELETE FROM flyway_schema_history WHERE version = '2';
