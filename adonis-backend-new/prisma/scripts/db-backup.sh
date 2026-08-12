#!/bin/bash

# Database backup script
BACKUP_DIR="./prisma/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/moringa_db_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Creating database backup..."
pg_dump $DATABASE_URL > $BACKUP_FILE

echo "Backup created: $BACKUP_FILE"

# Keep only last 7 backups
ls -t $BACKUP_DIR/moringa_db_*.sql | tail -n +8 | xargs -r rm

echo "Old backups cleaned up"
