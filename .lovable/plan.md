

# ByteSense — Edge Function, Logo Fix & Testing

## What we're building

Three things: (1) create the AI patient simulation edge function using Lovable AI Gateway, (2) replace the placeholder SVG logo with the real ByteSense logo image, and (3) update the Simulation screen to use non-streaming (simpler for this use case).

---

## Tasks

### 1. Copy the real ByteSense logo into the project
- Copy `user-uploads://Logo-2.png` to `public/bytesense-logo.png`
- Update `ByteSenseLogo.tsx`: replace the SVG `Logo` component with an `<img>` tag pointing to `/bytesense-logo.png`
- Update `LogoText` to remove the inline text rendering (the logo image already contains the wordmark)
- Update all screens that use `Logo`/`LogoText` to use the image logo correctly
- Also set as favicon in `index.html`

### 2. Create the `patient-sim` edge function
- Create `supabase/functions/patient-sim/index.ts`
- Uses `LOVABLE_API_KEY` to call `https://ai.gateway.lovable.dev/v1/chat/completions`
- Non-streaming: receives messages + systemPrompt from client, prepends system message, calls the gateway with `google/gemini-3-flash-preview`, returns `{ reply: string }`
- Handles CORS, 429/402 errors, input validation
- The system prompt stays on the backend (moved from client to edge function)

### 3. Update `Simulation.tsx`
- Remove `SIM_SYSTEM` constant from the client (it's now in the edge function)
- Send only `messages` in the request body (no `systemPrompt`)
- Keep the existing non-streaming fetch pattern — it already works correctly

### 4. Create `supabase/config.toml`
- Add the `patient-sim` function configuration

---

## Technical Details

**Edge function pattern:**
```
POST /functions/v1/patient-sim
Body: { messages: [{ role, content }] }
Response: { reply: "..." }
```

**Model:** `google/gemini-3-flash-preview` (default, fast, good for roleplay)

**Logo:** The uploaded image is a wide horizontal logo with icon + "byteSense®" text. We'll use it as-is at appropriate sizes, keeping the SVG as a small icon fallback for tight spaces.

