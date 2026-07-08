#!/usr/bin/env bash
# scripts/push.sh — push current workspace to GitHub
# Requires GITHUB_TOKEN env var (GitHub PAT with repo scope)
# Usage: pnpm run push

set -euo pipefail

OWNER="elijfields78"
REPO="pro-se-navigator"
BRANCH="main"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "❌  GITHUB_TOKEN is not set."
  echo "    Add it as a Replit secret, then re-run: pnpm run push"
  exit 1
fi

# Configure remote with token-authenticated URL
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git"
git remote set-url origin "$REMOTE_URL" 2>/dev/null || git remote add origin "$REMOTE_URL"

# Ensure git identity is set
git config user.name  "elijfields78"
git config user.email "elijfields78@gmail.com"

# Stage and commit
echo "Staging all changes..."
git add -A

if git diff --cached --quiet; then
  echo "✓ Nothing to commit — workspace is clean."
else
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  MESSAGE="chore: checkpoint ${TIMESTAMP}"
  git commit -m "$MESSAGE"
  echo "✓ Committed: $MESSAGE"
fi

# Push
echo "Pushing to ${OWNER}/${REPO}@${BRANCH}..."
git push origin "HEAD:${BRANCH}"
echo ""
echo "🎉 Done! https://github.com/${OWNER}/${REPO}"
