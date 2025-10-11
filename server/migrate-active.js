const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './data/cloaker.db';

console.log('Adicionando campo is_active...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir banco:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco');
});

db.serialize(() => {
  db.all("PRAGMA table_info(domains)", [], (err, columns) => {
    if (err) {
      console.error('Erro ao verificar tabela:', err);
      process.exit(1);
    }

    const hasIsActive = columns.some(col => col.name === 'is_active');

    if (!hasIsActive) {
      console.log('Adicionando coluna is_active...');
      db.run('ALTER TABLE domains ADD COLUMN is_active BOOLEAN DEFAULT 1', (err) => {
        if (err) {
          console.error('Erro ao adicionar is_active:', err);
        } else {
          console.log('✓ Coluna is_active adicionada');
        }
      });
    } else {
      console.log('✓ Coluna is_active já existe');
    }

    setTimeout(() => {
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar banco:', err);
          process.exit(1);
        }
        console.log('\n✅ Migração completa!');
        process.exit(0);
      });
    }, 1000);
  });
});
