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
  console.log('Creating database tables...');

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('✓ Users table ready');
  });

  // Insert master user
  db.run(`
    INSERT OR IGNORE INTO users (id, username, password, role, is_active)
    VALUES ('master-user-id', 'retia', 'Retia10@@', 'master', 1)
  `, (err) => {
    if (err) console.error('Error creating master user:', err);
    else console.log('✓ Master user ready');
  });

  // Templates table
  db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating templates table:', err);
    else console.log('✓ Templates table ready');
  });

  // Domains table
  db.run(`
    CREATE TABLE IF NOT EXISTS domains (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL UNIQUE,
      target_url TEXT NOT NULL,
      template_id TEXT,
      pass_query_params BOOLEAN DEFAULT 0,
      require_gclid BOOLEAN DEFAULT 0,
      mobile_only BOOLEAN DEFAULT 0,
      block_pingable_ips BOOLEAN DEFAULT 0,
      block_asn BOOLEAN DEFAULT 0,
      lockdown_mode BOOLEAN DEFAULT 0,
      lockdown_template_id TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id),
      FOREIGN KEY (lockdown_template_id) REFERENCES templates(id)
    )
  `, (err) => {
    if (err) console.error('Error creating domains table:', err);
    else console.log('✓ Domains table ready');
  });

  // ASN blocks table
  db.run(`
    CREATE TABLE IF NOT EXISTS asn_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      asn TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating asn_blocks table:', err);
    else console.log('✓ ASN blocks table ready');
  });

  // Country blocks table
  db.run(`
    CREATE TABLE IF NOT EXISTS country_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      country_code TEXT NOT NULL,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating country_blocks table:', err);
    else console.log('✓ Country blocks table ready');
  });

  // State blocks table
  db.run(`
    CREATE TABLE IF NOT EXISTS state_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      country_code TEXT NOT NULL,
      state_code TEXT NOT NULL,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating state_blocks table:', err);
    else console.log('✓ State blocks table ready');
  });

  // IP blocks table
  db.run(`
    CREATE TABLE IF NOT EXISTS ip_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating ip_blocks table:', err);
    else console.log('✓ IP blocks table ready');
  });

  // Access logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      country TEXT,
      state TEXT,
      asn TEXT,
      action TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating access_logs table:', err);
    else console.log('✓ Access logs table ready');
  });

  // Close database after a short delay to ensure all operations complete
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      }
      console.log('\n✅ Database initialized successfully!');
      console.log('You can now start your server with: npm run start:all');
      process.exit(0);
    });
  }, 2000);
});
