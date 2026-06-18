#!/bin/sh
set -e

if [ ! -f node_modules/.installed ]; then
  npm install
  touch node_modules/.installed
fi

exec "$@"
