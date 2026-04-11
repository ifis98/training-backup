

# Enhanced Practice Goals + Auto-Revenue Calculation + Prominent Display

## What changes

### 1. Redesign Goals Editor with Auto-Revenue Calculation
The current editor has two separate inputs: case goal and revenue goal. Replace with:
- **Monthly Case Goal** input (number of cases)
- **Price Per Case** input (dollar amount per case)
- **Revenue Goal** auto-calculates as `cases × price` (displayed live, not editable)
- Save all three values to `practice_goals` table

This requires a database migration to add a `price_per_case` column to `practice_goals`.

### 2. Make Practice Performance More Prominent
Move the Practice Performance section higher and make it visually bolder:
- Larger card height with bigger numbers
- Add a subtle glow/shadow effect to the container
- Show the auto-calculated revenue goal prominently with a "= $X" display next to the inputs
- When not editing, show the goals in a clear, bold format at the top

### 3. Case Analytics Charts
Already implemented — conversion rate AreaChart and revenue trend BarChart exist and are working. No changes needed here.

## Database changes
**Migration**: Add `price_per_case` numeric column (default 0) to `practice_goals` table.

## Files changed
1. **Database migration** — add `price_per_case` to `practice_goals`
2. **`src/screens/Dashboard.tsx`** — redesign goals editor with 2 inputs + auto-calculated revenue, make the section more prominent with larger styling
3. **`src/data/translations.ts`** — add keys: `price_per_case`, `auto_calculated`, `monthly_target`

## Implementation order
1. Database migration
2. Update goals editor UI with auto-calculation
3. Make Practice Performance section more prominent
4. Add translation keys

