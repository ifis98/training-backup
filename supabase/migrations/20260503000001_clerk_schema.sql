-- ================================================================
-- ByteSense v2 schema — Clerk auth (clerk_user_id TEXT replaces
-- Supabase auth user_id UUID throughout)
-- ================================================================

-- User roles (admin, staff, bytesense_admin)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'bytesense_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clerk_user_id, role)
);

-- Profiles (lightweight — name + practice for quick lookup)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  full_name TEXT,
  practice_name TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training progress (maps 1-1 with a Clerk user)
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  training_roles TEXT[] DEFAULT '{}',
  baseline_score INTEGER,
  done_modules TEXT[] DEFAULT '{}',
  name TEXT,
  practice TEXT,
  xp INTEGER DEFAULT 0,
  sim_patients INTEGER DEFAULT 0,
  signed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulation coaching reviews
CREATE TABLE IF NOT EXISTS simulation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  session_number INTEGER,
  score INTEGER,
  score_label TEXT,
  strengths TEXT[],
  improvements TEXT[],
  tips TEXT[],
  modules_to_review TEXT[],
  overall_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice intake (new onboarding flow)
CREATE TABLE IF NOT EXISTS practice_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,

  -- Step 2 — Decision maker
  is_decision_maker TEXT,          -- 'yes' | 'no' | 'shared'
  codecision_name TEXT,
  codecision_role TEXT,
  codecision_email TEXT,
  codecision_phone TEXT,

  -- Step 3 — Primary advocate
  primary_name TEXT,
  primary_role TEXT,
  primary_email TEXT,
  primary_phone TEXT,

  -- Step 4 — Secondary advocate
  secondary_name TEXT,
  secondary_role TEXT,
  secondary_email TEXT,
  secondary_phone TEXT,

  -- Step 5 — Role (mirrors training_progress.training_roles)
  staff_roles TEXT[] DEFAULT '{}',

  -- Step 6 — Night guard workflow
  monthly_volume TEXT,             -- '0-2' | '3-5' | '6-10' | '10+'
  who_presents TEXT,

  -- Step 7 — Billing
  who_bills TEXT,
  payment_collection TEXT,
  wants_billing_guidance TEXT,     -- 'yes' | 'no' | 'not_sure'

  -- Step 8 — Office workflow
  who_submits_cases TEXT,
  add_staff_to_training TEXT,      -- 'yes' | 'no' | 'later'

  -- Step 9 — First case readiness
  has_patient_in_mind TEXT,        -- 'yes' | 'no' | 'not_sure'
  ideal_patient_profile TEXT[] DEFAULT '{}',
  first_case_timeline TEXT,
  main_blocker TEXT,

  -- Lifecycle flags
  first_case_started BOOLEAN DEFAULT FALSE,
  first_case_submitted BOOLEAN DEFAULT FALSE,
  intake_complete BOOLEAN DEFAULT FALSE,
  current_step INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_training_progress_updated_at
  BEFORE UPDATE ON training_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_practice_intake_updated_at
  BEFORE UPDATE ON practice_intake
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS (permissive for now — tighten after Clerk JWT template is configured)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_intake ENABLE ROW LEVEL SECURITY;

-- Allow anon key full access until Clerk JWT RLS is configured
CREATE POLICY "anon_all_user_roles" ON user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_training_progress" ON training_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_simulation_reviews" ON simulation_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_practice_intake" ON practice_intake FOR ALL USING (true) WITH CHECK (true);
