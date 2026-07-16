#!/usr/bin/env bash
# Watches the paused training-platform Supabase project (krgjwtaavcxwyqbcesxu).
# The moment it is ACTIVE again, applies the staged scanner-question migration
# (scanner_type + scanner_other on practice_intake), verifies the columns,
# Telegrams Yash, and disarms itself. Runs hourly via launchd
# (com.bytesense.scanner-migration-watch). Safe to re-run: ALTERs are idempotent
# and the DONE file short-circuits everything.
set -euo pipefail
REF=krgjwtaavcxwyqbcesxu
DIR="$(cd "$(dirname "$0")" && pwd)"
DONE_FILE="$DIR/.scanner-migration-applied"
LOG="$DIR/scanner-migration-watch.log"
TG=/Users/yashlad/byteSense/important-updates/tg_send.sh

[ -f "$DONE_FILE" ] && exit 0
TOKEN=$(grep -iEo 'sbp_[A-Za-z0-9]+' ~/.secrets/supabase-access-token.md | head -1)

STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" "https://api.supabase.com/v1/projects/$REF" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("status","?"))')
echo "$(date '+%F %T') status=$STATUS" >> "$LOG"
[ "$STATUS" != "ACTIVE_HEALTHY" ] && exit 0

Q='ALTER TABLE practice_intake ADD COLUMN IF NOT EXISTS scanner_type TEXT, ADD COLUMN IF NOT EXISTS scanner_other TEXT; SELECT column_name FROM information_schema.columns WHERE table_name = '"'"'practice_intake'"'"' AND column_name IN ('"'"'scanner_type'"'"','"'"'scanner_other'"'"');'
OUT=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/$REF/database/query" \
  -d "$(python3 -c 'import json,sys; print(json.dumps({"query": sys.argv[1]}))' "$Q")")
echo "$(date '+%F %T') migration result: $OUT" >> "$LOG"

if echo "$OUT" | grep -q scanner_other; then
  touch "$DONE_FILE"
  # Deploy: push main to GitHub; Vercel auto-builds production (git-connected).
  # Commits must be Yash-authored: unseated contributors (e.g. tryea) get state
  # BLOCKED silently — that is what stranded the 2026-06-23 signature release.
  REPO="$DIR/.."
  OLD_JS=$(curl -s --max-time 15 'https://training.bytesense.ai/' | grep -o 'assets/index-[^"]*\.js' | head -1)
  if git -C "$REPO" -c credential.helper='!f() { echo username=ifis98; echo password=$(cat ~/.secrets/github-deploy-token.md); }; f' push upstream main:main >> "$LOG" 2>&1; then
    NEW_JS="$OLD_JS"
    for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
      sleep 20
      NEW_JS=$(curl -s --max-time 15 'https://training.bytesense.ai/' | grep -o 'assets/index-[^"]*\.js' | head -1)
      [ -n "$NEW_JS" ] && [ "$NEW_JS" != "$OLD_JS" ] && break
    done
    if [ -n "$NEW_JS" ] && [ "$NEW_JS" != "$OLD_JS" ]; then
      echo "Training Supabase DB restored, scanner migration applied, and the training app deployed to production automatically (new bundle $NEW_JS live on training.bytesense.ai). Nothing needed from you." | "$TG" || true
    else
      echo "Training Supabase DB restored + migration applied + pushed to main, but the new bundle is not live yet — check the Vercel deployment for remix-of-bytesense-onboarding-welcome." | "$TG" || true
    fi
  else
    echo "Training Supabase DB restored + migration applied, but the git push failed — check $LOG. Deploy manually: git push upstream main:main in remix-onboarding-work." | "$TG" || true
  fi
  launchctl bootout "gui/$(id -u)/com.bytesense.scanner-migration-watch" 2>/dev/null || true
else
  echo "Training Supabase DB is back ACTIVE but the scanner migration FAILED — check $LOG" | "$TG" || true
fi
