import { execSql, querySql } from './api/sqlite';
async function test() {
  const cleanCurrent = 'lobzik';
  const cleanTarget = 'phantom';
  
  console.log("Before:");
  let rows = await querySql("SELECT count(*) FROM direct_messages");
  console.log(rows);
  
  await execSql(
      'DELETE FROM direct_messages WHERE (LOWER(sender_id) = ? AND LOWER(recipient_id) = ?) OR (LOWER(sender_id) = ? AND LOWER(recipient_id) = ?)',
      [cleanCurrent, cleanTarget, cleanTarget, cleanCurrent]
    );
    
  console.log("After:");
  rows = await querySql("SELECT count(*) FROM direct_messages");
  console.log(rows);
}
test();
