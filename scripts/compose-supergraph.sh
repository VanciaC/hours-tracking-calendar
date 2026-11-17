#!/usr/bin/env bash
# Recompose router/supergraph.graphql à partir des sous-graphes qui tournent,
# puis redémarre le router.
#
# Prérequis : rover installé (https://www.apollographql.com/docs/rover/getting-started)
#   curl -sSL https://rover.apollo.dev/nix/latest | sh
set -euo pipefail

cd "$(dirname "$0")/.."

rover supergraph compose \
  --config router/supergraph.yaml \
  --elv2-license accept \
  --output router/supergraph.graphql

echo "Supergraph mis à jour, redémarrage du router..."
# Recreated, not restarted: rover replaces the file, and a restarted container
# would still point to the old one (single-file bind mounts follow the inode).
docker compose up -d --force-recreate router
