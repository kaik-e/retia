const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || './data/cloaker.db';
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');

    // Initialize tables
    db.serialize(() => {
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
      `);

      // Insert master user if not exists
      db.run(`
        INSERT OR IGNORE INTO users (id, username, password, role, is_active)
        VALUES ('master-user-id', 'retia', 'Retia10@@', 'master', 1)
      `);
    });

    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // Templates table
    db.run(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        filename TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Domains table
    db.run(`
      CREATE TABLE IF NOT EXISTS domains (
        id TEXT PRIMARY KEY,
        domain TEXT NOT NULL UNIQUE,
        target_url TEXT NOT NULL,
        template_id TEXT,
        pass_query_params BOOLEAN DEFAULT 1,
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
    `);
    
    // Add missing columns if they don't exist (for existing databases)
    db.run(`ALTER TABLE domains ADD COLUMN block_asn BOOLEAN DEFAULT 0`, () => {});
    db.run(`ALTER TABLE domains ADD COLUMN is_active BOOLEAN DEFAULT 1`, () => {});

    // ASN blocks table
    db.run(`
      CREATE TABLE IF NOT EXISTS asn_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain_id TEXT NOT NULL,
        asn TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
      )
    `);

    // Country blocks table
    db.run(`
      CREATE TABLE IF NOT EXISTS country_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain_id TEXT NOT NULL,
        country_code TEXT NOT NULL,
        FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
      )
    `);

    // State blocks table
    db.run(`
      CREATE TABLE IF NOT EXISTS state_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain_id TEXT NOT NULL,
        country_code TEXT NOT NULL,
        state_code TEXT NOT NULL,
        FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
      )
    `);

    // IP blocks table
    db.run(`
      CREATE TABLE IF NOT EXISTS ip_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain_id TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
      )
    `);

    // Analytics/logs table
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
    `);

    console.log('Database tables initialized');
  });
}

module.exports = db;
