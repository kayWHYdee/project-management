-- Rename the ProjectStatus enum value UNDER_MAINTENANCE -> DLP.
-- RENAME VALUE preserves existing rows (unlike a drop + recreate).
ALTER TYPE "pm"."ProjectStatus" RENAME VALUE 'UNDER_MAINTENANCE' TO 'DLP';
