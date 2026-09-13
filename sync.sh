#!/bin/bash

# Exit immediately if any command fails
set -e

# Ask you for a commit message before doing anything else
echo "📝 What did you change in this update?"
read -r commit_message

# If you just hit Enter without typing anything, give it a default fallback
if [ -z "$commit_message" ]; then
  commit_message="Auto-sync scripts: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "🚀 Starting Master Sync Process..."

# 1. Push Sheet Scripts to Google
echo "----------------------------------------"
echo "📄 Pushing Sheets scripts to Google..."
cd scripts-sheets
clasp push
cd ..

# 2. Push Form Script to Google
echo "----------------------------------------"
echo "📝 Pushing Form script to Google..."
cd scripts-form
clasp push
cd ..

# 3. Push everything to GitHub
echo "----------------------------------------"
echo "🐙 Pushing codebase to GitHub..."
git add .
git commit -m "$commit_message"
git push origin main

echo "----------------------------------------"
echo "✅ Success! Both Google and GitHub are fully updated."
