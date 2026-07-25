const fs = require('fs');
let code = fs.readFileSync('api/sqlite.ts', 'utf8');

const target = `    CREATE TABLE IF NOT EXISTS friends (
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT DEFAULT 'accepted',
      created_at INTEGER,
      PRIMARY KEY (user_id, friend_id)
    );`;

const replacement = `    CREATE TABLE IF NOT EXISTS friends (
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
    );`;

if (code.includes(target)) {
  console.log("Found target in api/sqlite.ts");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('api/sqlite.ts', code);
