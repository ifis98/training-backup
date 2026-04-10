

# Auto-Admin for @bytesense.ai + AI Simulations Button Fix

## 1. Auto-assign `bytesense_admin` role for @bytesense.ai emails

**Database migration**: Create a trigger function that fires after a new user is created (on the `profiles` table insert, which is already triggered by `handle_new_user`). If the user's email ends in `@bytesense.ai`, automatically insert a `bytesense_admin` role into `user_roles`.

```sql
CREATE OR REPLACE FUNCTION public.auto_assign_bytesense_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  IF user_email LIKE '%@bytesense.ai' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'bytesense_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_assign_admin
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_bytesense_admin();
```

This means any new account with a `@bytesense.ai` email automatically gets `bytesense_admin` access — no manual role assignment needed.

**For existing users**: Run a one-time data operation to assign `bytesense_admin` to any current users with `@bytesense.ai` emails who don't already have the role.

## 2. "Start AI Simulations" button → navigate to simulation screen

The AI Simulations KPI card (`s.simP/3`) currently just displays info. The AI Sim row in the training modules accordion (line 394-402 of Dashboard.tsx) does navigate to simulation but only when all modules are done.

**Changes to `src/screens/Dashboard.tsx`**:
- Make the AI Simulations KPI card clickable — when clicked, navigate to `{ phase: "simulation" }` (same behavior as the accordion row)
- Add a visible "Start AI Simulations →" button/link inside or below the KPI card
- Same treatment in `src/screens/StaffDashboard.tsx`

## 3. Summary of files changed

1. **Database migration** — trigger to auto-assign `bytesense_admin` role for `@bytesense.ai` emails
2. **`src/screens/Dashboard.tsx`** — Make AI Simulations KPI card clickable, navigates to simulation phase
3. **`src/screens/StaffDashboard.tsx`** — Same clickable simulation card

