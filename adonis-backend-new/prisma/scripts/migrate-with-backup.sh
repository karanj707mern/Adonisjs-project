#!/bin/bash

# Safe migration script with backup
BACKUP_DIR="./prisma/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/moringa_db_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Creating pre-migration backup..."
pg_dump $DATABASE_URL > $BACKUP_FILE

echo "Running migrations..."
npx prisma migrate dev

echo "Migration completed. Backup saved to: $BACKUP_FILE"
