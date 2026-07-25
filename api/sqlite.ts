import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const dbFilePath = path.join(process.cwd(), 'data', 'pulse.sqlite');

function initTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login TEXT UNIQUE NOT NULL,
      display_name TEXT,
      email TEXT,
      password TEXT,
      avatar TEXT,
      role TEXT,
      badge TEXT,
      bio TEXT,
      status TEXT,
      custom_status TEXT,
      is_verified INTEGER DEFAULT 1,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT,
      sender_avatar TEXT,
      content TEXT,
      timestamp INTEGER,
      attachments TEXT,
      reactions TEXT,
      pinned INTEGER DEFAULT 0,
      reply_to TEXT
    );

    CREATE TABLE IF NOT EXISTS direct_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      content TEXT,
      timestamp INTEGER,
      attachments TEXT,
      read_status INTEGER DEFAULT 0,
      reply_to TEXT
    );

    CREATE TABLE IF NOT EXISTS friends (
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT DEFAULT 'accepted',
      created_at INTEGER,
      PRIMARY KEY (user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS blocked_users (
      blocker_id TEXT NOT NULL,
      blocked_id TEXT NOT NULL,
      timestamp INTEGER,
      PRIMARY KEY (blocker_id, blocked_id)
    );

    CREATE TABLE IF NOT EXISTS call_signals (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      target_id TEXT,
      type TEXT NOT NULL,
      payload TEXT,
      timestamp INTEGER
    );

    CREATE TABLE IF NOT EXISTS sms_codes (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at INTEGER,
      used INTEGER DEFAULT 0
    );
  `);

  try {
    db.run("ALTER TABLE direct_messages ADD COLUMN reactions TEXT;");
  } catch (e) {
    // Column already exists or table doesn't exist yet, ignore
  }
}

export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  const dataDir = path.dirname(dbFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('⚠️ Could not load existing pulse.sqlite, creating fresh database:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  saveSqliteDb();
  console.log('✅ SQLite Database (sql.js) initialized at data/pulse.sqlite');
  return dbInstance;
}

export function saveSqliteDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const dataDir = path.dirname(dbFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('❌ Failed to save SQLite db to disk:', err);
  }
}

// Helper queries for SQLite
export async function querySql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getSqliteDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export async function execSql(sql: string, params: any[] = []): Promise<void> {
  const db = await getSqliteDb();
  db.run(sql, params);
  saveSqliteDb();
}
