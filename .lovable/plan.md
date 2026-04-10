

# Add Knowledge Score, Training Recommendations & Improvement Tips to Dashboards

## What Gets Added

### Knowledge Score Calculation
Derive a "Knowledge Score" from existing data: baseline score (`s.blScore`), module quiz performance (can be computed from completed modules and XP), and simulation performance (`s.simP`). Display as a prominent radial gauge on both dashboards.

Formula: weighted average of baseline score (30%), module completion rate (40%), simulation score (30%). Displayed as 0–100.

### Training Recommendations Engine
Analyze which phases/modules are incomplete and which quiz topics were weak. Generate personalized recommendations like "Complete Phase 3 — Product Knowledge" or "Review patient communication techniques." Shown as a prioritized card list with action buttons that navigate to the relevant module.

### Areas Needing Improvement + Tips
Based on incomplete phases and low-score areas, show categorized improvement cards (e.g., "Sales Techniques", "Patient Communication", "Product Knowledge") with specific tips pulled from module content. Each card has a color-coded priority indicator (red/yellow/green).

## Files Changed

1. **`src/screens/Dashboard.tsx`** — Add Knowledge Score gauge, recommendations section, improvement tips section (owner sees their own + aggregate staff view)
2. **`src/screens/StaffDashboard.tsx`** — Add personal Knowledge Score gauge, personalized recommendations, improvement areas with tips
3. **`src/data/translations.ts`** — Add ~15 new keys: `knowledge_score`, `training_recommendations`, `areas_to_improve`, `improvement_tips`, `recommended_next`, `priority_high/medium/low`, `score_excellent/good/needs_work`
4. **`src/lib/helpers.ts`** — Add `computeKnowledgeScore()` and `getRecommendations()` utility functions that both dashboards share

## Implementation Details

**Knowledge Score** — New KPI card with a circular progress ring (SVG-based, not recharts) showing the computed score with color coding: green (80+), gold (50-79), red (below 50).

**Recommendations** — Glass card with ordered list. Each item shows phase icon, module title, estimated time, and a "Start" button. Limited to top 3-5 most impactful recommendations.

**Improvement Areas** — Grid of glass cards grouped by category (Communication, Product, Sales, Operations, Advanced). Each shows completion % for that category, 2-3 specific tips, and links to relevant modules. Uses the phase color coding from constants.

