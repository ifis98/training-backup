-- Add portal account registration fields to practice_intake table.
-- These are collected during TypeformIntake steps 2-10 (before existing training questions).
-- Part of Task 5: Extend TypeformIntake — Registration Field Groups + /app Gating.

ALTER TABLE practice_intake
  ADD COLUMN IF NOT EXISTS "fName" TEXT,
  ADD COLUMN IF NOT EXISTS "lName" TEXT,
  ADD COLUMN IF NOT EXISTS "preferredPhoneNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "companyName" TEXT,
  ADD COLUMN IF NOT EXISTS "officeEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryContactName" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryContactRole" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryContactPhoneNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "preferredContactMethodPhone" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "preferredContactMethodEmail" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "addressLine1" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "zipCode" TEXT,
  ADD COLUMN IF NOT EXISTS "attentionRecipientName" TEXT,
  ADD COLUMN IF NOT EXISTS "preferredNotificationMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "estimatedOrdersPerMonth" TEXT,
  ADD COLUMN IF NOT EXISTS "dentalLicenseNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "webappPassword" TEXT;
