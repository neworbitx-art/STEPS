#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p dist
cp index.html demo.html dist/
cp -R assets dist/
