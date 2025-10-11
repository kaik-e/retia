#!/bin/bash

# C0alk Backup Script
# Backs up database and templates

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="c0alk_backup_$TIMESTAMP"

echo "Creating backup: $BACKUP_NAME"

# Create backup directory
mkdir -p $BACKUP_DIR/$BACKUP_NAME

# Backup database
if [ -f "./data/cloaker.db" ]; then
    echo "Backing up database..."
    cp ./data/cloaker.db $BACKUP_DIR/$BACKUP_NAME/
fi

# Backup templates
if [ -d "./data/templates" ]; then
    echo "Backing up templates..."
    cp -r ./data/templates $BACKUP_DIR/$BACKUP_NAME/
fi

# Backup nginx configs
if [ -d "./nginx/sites-enabled" ]; then
    echo "Backing up nginx configs..."
    cp -r ./nginx/sites-enabled $BACKUP_DIR/$BACKUP_NAME/
fi

# Create archive
cd $BACKUP_DIR
tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME
rm -rf $BACKUP_NAME

echo "Backup complete: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Keep only last 10 backups
ls -t *.tar.gz | tail -n +11 | xargs -r rm

echo "Cleanup complete. Keeping last 10 backups."
