const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('pulse_local.db');
db.all("SELECT DISTINCT thread_id FROM direct_messages", (err, rows) => {
  console.log(rows);
});
