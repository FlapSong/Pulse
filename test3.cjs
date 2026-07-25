const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('pulse_local.db');
db.all("SELECT id, thread_id, sender_id, recipient_id, content FROM direct_messages", (err, rows) => {
  console.log(rows);
});
