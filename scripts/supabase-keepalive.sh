#!/usr/bin/env bash
# Keeps the FREE-plan training Supabase project (krgjwtaavcxwyqbcesxu) from
# auto-pausing after ~7 days without traffic. The 2026-07-14 pause took every
# DB-backed feature on training.bytesense.ai down and the restore was blocked
# for 2 days on org-admin free-project limits (see platform-issues.md).
# A tiny authenticated PostgREST request counts as project activity, so a
# daily ping prevents the idle-pause entirely. Runs via launchd
# (com.bytesense.supabase-keepalive, daily). Telegrams Yash ONLY on failure.
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$DIR/supabase-keepalive.log"
TG=/Users/yashlad/byteSense/important-updates/tg_send.sh
ENVF="$DIR/../.env"

URL=$(grep -m1 '^VITE_SUPABASE_URL=' "$ENVF" | cut -d= -f2- | tr -d '"')
KEY=$(grep -m1 '^VITE_SUPABASE_PUBLISHABLE_KEY=' "$ENVF" | cut -d= -f2- | tr -d '"')
if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "$(date '+%F %T') FAIL missing env in $ENVF" >> "$LOG"
  echo "Training Supabase keep-alive is misconfigured (missing VITE_SUPABASE_URL/KEY in remix-onboarding-work/.env) — the free project can idle-pause again." | "$TG" || true
  exit 1
fi

# /auth/v1/health answers 200 to the publishable key; /rest/v1/ 401s it
# (sb_publishable_* is not a JWT, so no Authorization header either).
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
  -H "apikey: $KEY" "$URL/auth/v1/health")
echo "$(date '+%F %T') ping HTTP $CODE" >> "$LOG"
case "$CODE" in
  2??|3??) exit 0 ;;
esac
echo "Training Supabase keep-alive ping FAILED (HTTP $CODE) — the free project (krgjwtaavcxwyqbcesxu) may have paused or broken again; training.bytesense.ai DB features are at risk. See remix-onboarding-work/scripts/supabase-keepalive.log." | "$TG" || true
exit 1
