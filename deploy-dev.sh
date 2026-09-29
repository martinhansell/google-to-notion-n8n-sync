#!/bin/bash
set -e

EXPECTED_ROOT="/home/martin/Documents/Development/Google-to-Notion-n8n-Sync"
DEV_SHEETS_ID="1E6-kGBghehkNBci7nX_ctEU1eZeDbBG9qVLD7trPqJ7ezs5AetNzFKsY"

echo "🧢 DEV deployment pre-flight..."

# Guard 1 — must be the Development checkout
CURRENT_ROOT="$(git rev-parse --show-toplevel)"
if [ "$CURRENT_ROOT" != "$EXPECTED_ROOT" ]; then
  echo "❌ STOP: This is not the Development checkout."
  exit 1
fi

# Guard 2 — never deploy DEV from main
BRANCH="$(git branch --show-current)"
if [ "$BRANCH" = "main" ]; then
  echo "❌ STOP: DEV deployment cannot run from main."
  exit 1
fi

# Guard 3 — clasp must target the DEV/SAFE Apps Script project
ACTUAL_ID="$(grep -oP '"scriptId"\s*:\s*"\K[^"]+' scripts-sheets/.clasp.json)"

if [ "$ACTUAL_ID" != "$DEV_SHEETS_ID" ]; then
  echo "❌ STOP: Sheets clasp target is not DEV/SAFE."
  exit 1
fi

echo "✅ Checkout: Development"
echo "✅ Branch: $BRANCH"
echo "✅ Google target: DEV/SAFE"
echo
echo "🚀 Deploying Sheets Apps Script to DEV..."

cd scripts-sheets
clasp push

echo
echo "✅ DEV Sheets deployment complete."
