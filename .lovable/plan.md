

# AI Simulation Coaching & Training-Aligned Patient Questions

## Problem
Two issues: (1) Patient personas like Patricia ask questions (e.g., "What's the sensor accuracy?" "Is there clinical validation?") that aren't well-covered in the training modules, leaving employees unable to answer confidently. (2) When an employee gives a weak or incorrect response, the simulation just moves on — there's no feedback or coaching.

## Solution

### 1. Add a Coaching Mode to the Simulation

When the employee struggles (vague, incorrect, or off-brand response), the AI will break from the patient roleplay and provide a **coaching tip** — a short, actionable suggestion of what they could have said, referencing the actual training content.

**How it works:**
- Update the patient system prompts in `supabase/functions/patient-sim/index.ts` to include a coaching instruction
- After each user message, the AI evaluates the response quality. If the response is weak, vague, uses forbidden language ("night guard"), or misses a key technique from training, the patient responds naturally AND a coaching note is appended in a distinct format: `[COACH: Here's what would work better — ...]`
- The coaching tip references specific ByteSense training concepts (e.g., "Try the Feel-Felt-Found framework", "Remember to reframe cost vs. $15K–$40K in damage")
- On the client side, `Simulation.tsx` parses `[COACH: ...]` blocks from AI responses and renders them as a visually distinct coaching card (gold border, different background) below the patient's chat bubble

### 2. Inject Training Knowledge into Patient Prompts

The patient system prompts currently have no knowledge of what the training teaches. Update each persona's system prompt to include a condensed "training cheat sheet" so the AI:
- Asks questions that ARE answerable from the training (sensor types, 5 metrics, wellness positioning, pricing moment, objection handling frameworks)
- Knows what a GOOD answer looks like (so it can coach effectively)
- Still challenges the employee, but within the scope of what they've been taught

**Cheat sheet content** (appended to each persona's system prompt):
- ByteSense = wellness health intelligence platform, NEVER "night guard"
- 5 sensors: HR/HRV, EMG grinding, respiratory, temperature, motion
- bitely app, daily byteSense Score (0-100), Apple/Google Health integration
- Wellness device category (like Apple Watch), no prescription needed
- Comfort: custom-fit from exact scan, 3-7 nights to adjust
- Cost reframe: one-time investment vs. $15K-$40K in dental damage over 10 years
- Objection handling: Feel-Felt-Found framework, Isolation Technique for "think about it"
- Price moment: state price, then SILENCE
- 8-stage patient journey, warm handoff protocol

### 3. Update Simulation.tsx UI

- Parse `[COACH: ...]` from AI responses and render as a separate coaching card
- Style: gold left border, dark background, coach icon, smaller text
- Show a "Training Tip" label so employees know this is guidance, not the patient talking
- Track coaching interactions (optional: count how many tips were given per session)

## Files Changed

1. **`supabase/functions/patient-sim/index.ts`** — Update all 6 patient system prompts with training cheat sheet + coaching instructions
2. **`src/screens/Simulation.tsx`** — Parse and render coaching tips as distinct UI cards

## Implementation Order

1. Update edge function with enriched prompts + coaching behavior
2. Deploy edge function
3. Update Simulation.tsx to parse and render coaching cards

