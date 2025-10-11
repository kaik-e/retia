const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || './data/cloaker.db';
const dbDir = path.dirname(dbPath);

console.log('Running database migration...');
console.log('Database path:', dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✓ Data directory created');
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});

db.serialize(() => {
  // Check if columns exist
  db.all("PRAGMA table_info(domains)", [], (err, columns) => {
    if (err) {
      console.error('Error checking table:', err);
      process.exit(1);
    }

    const hasLockdownMode = columns.some(col => col.name === 'lockdown_mode');
    const hasLockdownTemplateId = columns.some(col => col.name === 'lockdown_template_id');

    if (!hasLockdownMode) {
      console.log('Adding lockdown_mode column...');
      db.run('ALTER TABLE domains ADD COLUMN lockdown_mode BOOLEAN DEFAULT 0', (err) => {
        if (err) {
          console.error('Error adding lockdown_mode:', err);
        } else {
          console.log('✓ Added lockdown_mode column');
        }
      });
    } else {
      console.log('✓ lockdown_mode column already exists');
    }

    if (!hasLockdownTemplateId) {
      console.log('Adding lockdown_template_id column...');
      db.run('ALTER TABLE domains ADD COLUMN lockdown_template_id TEXT', (err) => {
        if (err) {
          console.error('Error adding lockdown_template_id:', err);
        } else {
          console.log('✓ Added lockdown_template_id column');
        }
      });
    } else {
      console.log('✓ lockdown_template_id column already exists');
    }

    // Close database after a short delay to ensure all operations complete
    setTimeout(() => {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          process.exit(1);
        }
        console.log('\n✅ Migration complete!');
        console.log('You can now restart your server.');
        process.exit(0);
      });
    }, 1000);
  });
});
