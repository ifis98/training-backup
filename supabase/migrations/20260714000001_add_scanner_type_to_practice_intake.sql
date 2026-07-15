-- Add scanner_type to practice_intake: "What scanner do you use?" asked during
-- the training-intake section of TypeformIntake (question 12).
-- Values: itero | trios | medit | sirona | dexis | shining3d | alliedstar | other | none
-- scanner_other: free-text make/model, collected only when scanner_type = 'other' (question 12b).

ALTER TABLE practice_intake
  ADD COLUMN IF NOT EXISTS scanner_type TEXT,
  ADD COLUMN IF NOT EXISTS scanner_other TEXT;
