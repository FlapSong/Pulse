import { querySql } from './api/sqlite';
async function test() {
  const rows = await querySql("SELECT login FROM users");
  console.log(rows);
}
test();
