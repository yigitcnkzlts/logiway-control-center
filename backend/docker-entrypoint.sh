#!/bin/sh
set -eu

# Managed Postgres providers commonly expose postgresql:// URLs, while the
# PostgreSQL JDBC driver expects jdbc:postgresql://.
case "${DB_URL:-}" in
  postgresql://*|postgres://*)
    database_address="${DB_URL#*://}"
    # Render's connection string contains user:password@. Credentials are
    # already supplied separately through DB_USER and DB_PASSWORD, so remove
    # the user-info portion before handing the URL to the JDBC driver.
    case "$database_address" in
      *@*) database_address="${database_address#*@}" ;;
    esac
    DB_URL="jdbc:postgresql://${database_address}"
    ;;
esac

export DB_URL
exec java -jar /app/app.jar
