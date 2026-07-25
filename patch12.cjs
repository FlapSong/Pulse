const fs = require('fs');
let code = fs.readFileSync('api/server.ts', 'utf8');

const target = `  const blockedList = usersList
    .filter((u) => (me.blockedLogins || []).includes(u.login))
    .map((u) => sanitizeUser(u));

  res.json({
    success: true,
    friends: friendsList,
    incomingRequests: incomingList,
    outgoingRequests: outgoingList,
    blockedLogins: me.blockedLogins || [],
    blockedUsers: blockedList
  });`;

const replacement = `  const blockedList = usersList
    .filter((u) => (me.blockedLogins || []).includes(u.login))
    .map((u) => sanitizeUser(u));

  const blockedByLogins = usersList
    .filter((u) => (u.blockedLogins || []).includes(me.login))
    .map((u) => u.login);

  res.json({
    success: true,
    friends: friendsList,
    incomingRequests: incomingList,
    outgoingRequests: outgoingList,
    blockedLogins: me.blockedLogins || [],
    blockedUsers: blockedList,
    blockedByLogins: blockedByLogins
  });`;

if (code.includes(target)) {
  console.log("Found target in api/server.ts");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('api/server.ts', code);
