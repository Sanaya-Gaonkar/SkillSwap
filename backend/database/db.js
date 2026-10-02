const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
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

  const goalColumns = await db.allAsync('PRAGMA table_info(learning_goals)');
  if (!goalColumns.some((column) => column.name === 'baseline')) {
    await db.execAsync('ALTER TABLE learning_goals ADD COLUMN baseline INTEGER NOT NULL DEFAULT 0');
  }

  const skillCount = await db.getAsync('SELECT COUNT(*) AS total FROM skills');
  if (skillCount.total === 0) {
    const starterSkills = [
      ['Python', 'Programming', 'Python programming, scripting, and data analysis'],
      ['Java', 'Programming', 'Java programming and object-oriented fundamentals'],
      ['JavaScript', 'Programming', 'Modern JavaScript and interactive programming'],
      ['C++', 'Programming', 'C++ programming and data structures'],
      ['SQL', 'Programming', 'Database queries, joins, and relational design'],
      ['R', 'Programming', 'Statistical programming and data visualization'],
      ['HTML', 'Web', 'Semantic HTML and accessible web structure'],
      ['CSS', 'Web', 'Responsive styling, layouts, and animations'],
      ['Web Development', 'Web', 'Frontend and backend web development'],
      ['React', 'Web', 'Reusable user interfaces with React'],
      ['UI/UX', 'Design', 'User research, wireframing, and interaction design'],
      ['Figma', 'Design', 'Interface design, prototyping, and design systems'],
      ['Graphic Design', 'Design', 'Typography, composition, and visual communication'],
      ['Photoshop', 'Design', 'Photo editing and image composition'],
      ['Illustrator', 'Design', 'Vector illustration and logo design'],
      ['Public Speaking', 'Business', 'Presentation, speech structure, and delivery'],
      ['Business Presentation', 'Business', 'Business storytelling and presentation design'],
      ['Financial Modelling', 'Business', 'Financial statements, forecasting, and valuation'],
      ['Social Media Strategy', 'Business', 'Social content planning and engagement analytics'],
      ['Academic Writing', 'Other', 'Research writing, citations, and editing'],
      ['Spanish', 'Other', 'Spanish conversation, grammar, and vocabulary'],
      ['Video Editing', 'Other', 'Video editing, pacing, and audio balancing'],
      ['Git/GitHub', 'Other', 'Version control, branches, and collaboration'],
      ['Excel', 'Other', 'Formulas, PivotTables, and spreadsheet analysis']
    ];
    for (const [name, category, description] of starterSkills) {
      await db.runAsync(
        'INSERT INTO skills (name, category, description) VALUES (?, ?, ?)',
        [name, category, description]
      );
    }
  }

  const adminEmail = 'admin@skillswap.edu';
  const adminName = 'admin';
  const adminPassword = 'admin12';
  let admin = await db.getAsync('SELECT id, password FROM users WHERE email = ? COLLATE NOCASE', [adminEmail]);
  const passwordMatches = admin && await bcrypt.compare(adminPassword, admin.password);
  const passwordHash = passwordMatches ? admin.password : await bcrypt.hash(adminPassword, 10);

  if (!admin) {
    const result = await db.runAsync(
      `INSERT INTO users (name, email, password, role, status)
       VALUES (?, ?, ?, 'Admin', 'active')`,
      [adminName, adminEmail, passwordHash]
    );
    admin = { id: result.lastID };
  } else {
    await db.runAsync(
      `UPDATE users SET name = ?, password = ?, role = 'Admin', status = 'active'
       WHERE id = ?`,
      [adminName, passwordHash, admin.id]
    );
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO profiles (user_id, avatar, course, year, bio, interests, availability, learning_mode)
     VALUES (?, ?, 'Administration', 'Staff', 'Platform Administrator.', 'Community moderation', 'Regular campus hours', 'System management')`,
    [admin.id, 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin']
  );
  await db.runAsync(
    'INSERT OR IGNORE INTO admins (user_id, name, email) VALUES (?, ?, ?)',
    [admin.id, adminName, adminEmail]
  );
}

module.exports = {
  db,
  initDb
};
