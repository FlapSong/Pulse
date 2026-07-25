const fs = require('fs');
let code = fs.readFileSync('src/entities/user/userStore.ts', 'utf8');

const target = `          set({
            friends: fetchedFriends,
            incomingRequests: nextIncoming,
            outgoingRequests: data.outgoingRequests || []
          });`;

const replacement = `          set({
            friends: fetchedFriends,
            incomingRequests: nextIncoming,
            outgoingRequests: data.outgoingRequests || [],
            blockedLogins: data.blockedLogins || []
          });`;

if (code.includes(target)) {
  console.log("Found target in userStore.ts");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('src/entities/user/userStore.ts', code);
