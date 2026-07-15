-- Add scanner_type to practice_intake: "What scanner do you use?" asked during
-- the training-intake section of TypeformIntake (question 12).
-- Values: itero | trios | medit | sirona | dexis | shining3d | alliedstar | other | none

ALTER TABLE practice_intake
  ADD COLUMN IF NOT EXISTS scanner_type TEXT;
