-- Source of truth for "has this user completed intake".
--
-- Before this column existed, useAppState.ts treated the mere presence of a
-- training_progress row as "intake done" — but the debounced sync creates a
-- stub row as soon as the user lands on any non-splash phase, even before
-- intake completes. That misidentified new users as returning users and
-- skipped the IntakeFlow.
--
-- This column is monotonic: only `true` is ever written (in immediateSync on
-- intake completion, and idempotently in the debounced sync when s.intakeDone
-- is already true). Pre-intake stub rows omit the column → keeps default
-- false.

ALTER TABLE training_progress
  ADD COLUMN IF NOT EXISTS intake_done boolean NOT NULL DEFAULT false;

-- Backfill: any existing user who has progressed past intake gets true.
-- Conservative — uses multiple post-intake signals (not just `name`) so
-- legacy users from earlier intake-form versions don't get bounced back.
UPDATE training_progress
   SET intake_done = true
 WHERE intake_done = false
   AND (
     (name IS NOT NULL AND length(trim(name)) > 0)
     OR baseline_score IS NOT NULL
     OR array_length(training_roles, 1) > 0
     OR array_length(done_modules, 1) > 0
     OR signed = true
   );
