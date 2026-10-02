const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path: database/skillswap.db relative to project root or local
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, '../../database/skillswap.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

// Helper promisified query methods
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

db.execAsync = function (sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Initialize schema
async function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.execAsync(schemaSql);
  }

  // Migrate older SkillSwap databases so account types can include
  // Student, Teacher, Corporate Employee, Other, and the protected Admin role.
  const usersSql = await db.getAsync("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  if (usersSql?.sql && !usersSql.sql.includes("'Teacher'") ) {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    await db.execAsync(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'Student' CHECK(role IN ('Student', 'Teacher', 'Corporate Employee', 'Other', 'Admin')),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users_new (id, name, email, password, role, status, created_at)
      SELECT id, name, email, password, role, status, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
    `);
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }

  const profileColumns = await db.allAsync('PRAGMA table_info(profiles)');
  const existingProfileColumns = new Set(profileColumns.map((column) => column.name));
  const newProfileColumns = [
    ['institute', 'TEXT'],
    ['experience_years', 'INTEGER'],
    ['designation', 'TEXT'],
    ['company', 'TEXT']
  ];
  for (const [column, type] of newProfileColumns) {
    if (!existingProfileColumns.has(column)) {
      await db.execAsync(`ALTER TABLE profiles ADD COLUMN ${column} ${type}`);
    }
  }
}

module.exports = {
  db,
  initDb
};
