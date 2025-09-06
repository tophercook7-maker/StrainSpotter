#!/usr/bin/env bash
set -euo pipefail
msg="${1:-Checkpoint}"
STAMP="$(date +%Y%m%d-%H%M%S)"
git add -A
git commit -m "$msg" || true
git tag -a "restore-$STAMP" -m "$msg"
git push || true
git push --tags || true
mkdir -p "$HOME/StrainSpotter_RestorePoints"
REV="$(git rev-parse --short HEAD)"
tar -czf "$HOME/StrainSpotter_RestorePoints/StrainSpotter_${STAMP}_${REV}.tar.gz" .
echo "Restore point saved: $HOME/StrainSpotter_RestorePoints/StrainSpotter_${STAMP}_${REV}.tar.gz"
