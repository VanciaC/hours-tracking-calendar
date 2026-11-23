#!/usr/bin/env bash
# Deploys a commit of main on the production server.
# Run by GitHub Actions through a restricted SSH key, or by hand: scripts/deploy.sh [sha]
set -euo pipefail

app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$app_dir"

# Only one deployment at a time.
exec 9>/tmp/hours-tracking-calendar-deploy.lock
if ! flock -n 9; then
  echo "Another deployment is running." >&2
  exit 1
fi

# The commit to deploy: sent by GitHub Actions over SSH, given as argument, or the tip of main.
target="${SSH_ORIGINAL_COMMAND:-${1:-}}"

git fetch --quiet origin main
if [[ -z "$target" ]]; then
  target="$(git rev-parse origin/main)"
fi

if [[ ! "$target" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid commit: $target" >&2
  exit 1
fi

if ! git merge-base --is-ancestor "$target" origin/main; then
  echo "Commit $target is not on main." >&2
  exit 1
fi

if [[ "$(git rev-parse HEAD)" != "$target" ]]; then
  # Never go back to an older commit.
  if git merge-base --is-ancestor "$target" HEAD; then
    echo "A newer commit is already deployed, nothing to do."
    exit 0
  fi

  # Refuse to deploy if the server's copy has diverged from main.
  if ! git merge-base --is-ancestor HEAD "$target"; then
    echo "The server's copy has diverged from main, fix it by hand." >&2
    exit 1
  fi

  git merge --ff-only --quiet "$target"
fi

compose=(docker compose -f docker-compose.prod.yml --env-file .env.prod)
"${compose[@]}" build
# --wait fails the deployment if a service does not become healthy.
"${compose[@]}" up -d --remove-orphans --wait --wait-timeout 180
docker image prune -f >/dev/null

echo "Deployed $(git rev-parse --short HEAD)."