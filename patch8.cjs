const fs = require('fs');
let code = fs.readFileSync('api/server.ts', 'utf8');

const target = `  res.json({
    success: true,
    friends: friendsList,
    incomingRequests: incomingList,
    outgoingRequests: outgoingList
  });`;

const replacement = `  const blockedList = usersList
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

if (code.includes(target)) {
  console.log("Found target in api/server.ts");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('api/server.ts', code);
