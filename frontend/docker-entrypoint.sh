#!/bin/sh
set -e

cd /app

if [ ! -x node_modules/.bin/next ]; then
  echo "webface: node_modules отсутствует — выполняю npm install..."
  npm install
fi

exec "$@"
