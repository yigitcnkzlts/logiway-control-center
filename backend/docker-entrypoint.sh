#!/bin/sh
set -eu

# Managed Postgres providers commonly expose postgresql:// URLs, while the
# PostgreSQL JDBC driver expects jdbc:postgresql://.
case "${DB_URL:-}" in
  postgresql://*) DB_URL="jdbc:${DB_URL}" ;;
  postgres://*) DB_URL="jdbc:postgresql://${DB_URL#postgres://}" ;;
esac

export DB_URL
exec java -jar /app/app.jar
