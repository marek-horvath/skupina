#!/bin/sh
set -eu

seed_directory() {
  source_dir="$1"
  target_dir="$2"

  mkdir -p "$target_dir"
  if [ -z "$(find "$target_dir" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
    cp -a "$source_dir"/. "$target_dir"/
  fi
}

if [ "${SEUG_SEED_DATA:-false}" = "true" ]; then
  seed_directory /opt/seug-seed/data /app/data
  seed_directory /opt/seug-seed/public-data /app/public/data
  chown -R node:node /app/data /app/public/data
fi

exec su-exec node "$@"
