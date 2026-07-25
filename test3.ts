import { execSql, querySql } from './api/sqlite';
async function test() {
  const rows = await querySql("SELECT id, thread_id, sender_id, recipient_id, content FROM direct_messages");
  console.log(rows);
}
test();
