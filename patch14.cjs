const fs = require('fs');
let code = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8');

const target1 = `    blockedLogins
  } = useUserStore();`;
const replacement1 = `    blockedLogins,
    blockedByLogins
  } = useUserStore();`;

code = code.replace(target1, replacement1);

const target2 = `  const isBlockedUser = activeChatUser ? blockedLogins.includes(activeChatUser.username.toLowerCase()) : false;`;
const replacement2 = `  const isBlockedUser = activeChatUser ? blockedLogins.includes(activeChatUser.username.toLowerCase()) : false;
  const hasBlockedMe = activeChatUser ? blockedByLogins.includes(activeChatUser.username.toLowerCase()) : false;`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', code);
