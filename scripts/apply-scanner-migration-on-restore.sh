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
  echo "Training Supabase DB is restored. scanner_type/scanner_other migration applied automatically. Training app is ready to deploy: tell Claude 'deploy the training app'." | "$TG" || true
  launchctl bootout "gui/$(id -u)/com.bytesense.scanner-migration-watch" 2>/dev/null || true
else
  echo "Training Supabase DB is back ACTIVE but the scanner migration FAILED — check $LOG" | "$TG" || true
fi
