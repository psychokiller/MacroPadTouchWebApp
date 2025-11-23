#!/usr/bin/env bash
set -euo pipefail

# Resolve project root (directory containing this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$ROOT_DIR/../../data/web"

echo "[build] Project root: $ROOT_DIR"
echo "[build] Output dir:  $OUT_DIR"

# Ensure output directory exists and is clean
mkdir -p "$OUT_DIR"
rm -rf "$OUT_DIR"/*

# Build file-manager
echo "[build] Building file-manager..."
(
  cd "$ROOT_DIR/file-manager"
  npm run build
)

# Build wifi-scanner
echo "[build] Building wifi-scanner..."
(
  cd "$ROOT_DIR/wifi-scanner"
  npm run build
)

# Note: Vite is configured in each app to output bundles directly into $OUT_DIR
# (see outDir in file-manager/vite.config.js and wifi-scanner/vite.config.js),
# so there is no local dist/ directory to copy from.

# Copy HTML files from components and root index.html
echo "[build] Copying HTML files..."
cp "$ROOT_DIR/index.html" "$OUT_DIR/"
cp "$ROOT_DIR/file-manager"/src/*.html "$OUT_DIR/"
cp "$ROOT_DIR/wifi-scanner"/src/*.html "$OUT_DIR/"

echo "[build] Done. All generated and HTML files are in: $OUT_DIR"