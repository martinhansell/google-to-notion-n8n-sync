#!/bin/bash
set -e

EXPECTED_ROOT="/home/martin/Documents/GitRepos/Google-to-Notion-n8n-Sync"
LIVE_SHEETS_ID="1s7_1A8Gmjlsnk9Vc2DWLTAcOBYekdZojbxmvQI1nvFRmWLxnxFTt9S2u"

echo "🎩 LIVE deployment pre-flight..."

# Guard 1 — must be the Production checkout
CURRENT_ROOT="$(git rev-parse --show-toplevel)"
if [ "$CURRENT_ROOT" != "$EXPECTED_ROOT" ]; then
  echo "❌ STOP: This is not the Production checkout."
  exit 1
fi

# Guard 2 — production deployments come only from main
BRANCH="$(git branch --show-current)"
if [ "$BRANCH" != "main" ]; then
  echo "❌ STOP: LIVE deployment requires the main branch."
  exit 1
fi

# Guard 3 — working tree must be clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ STOP: Production working tree is not clean."
  exit 1
fi

# Guard 4 — main must match origin/main
git fetch origin main --quiet

LOCAL_SHA="$(git rev-parse main)"
REMOTE_SHA="$(git rev-parse origin/main)"

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  echo "❌ STOP: Local main does not match origin/main."
  exit 1
fi

# Guard 5 — clasp must target LIVE
ACTUAL_ID="$(grep -oP '"scriptId"\s*:\s*"\K[^"]+' scripts-sheets/.clasp.json)"

if [ "$ACTUAL_ID" != "$LIVE_SHEETS_ID" ]; then
  echo "❌ STOP: Sheets clasp target is not LIVE."
  exit 1
fi

echo "✅ Checkout: Production"
echo "✅ Branch: main"
echo "✅ Working tree: clean"
echo "✅ main matches origin/main"
echo "✅ Google target: LIVE"

echo
echo "⚠️  This will deploy Apps Script code to LIVE."
printf 'Type DEPLOY LIVE to continue: '
read -r confirmation

if [ "$confirmation" != "DEPLOY LIVE" ]; then
  echo "❌ LIVE deployment cancelled."
  exit 1
fi

echo
echo "🚀 Deploying Sheets Apps Script to LIVE..."

cd scripts-sheets
clasp push

echo
echo "✅ LIVE Sheets deployment complete."
