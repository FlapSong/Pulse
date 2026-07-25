const fs = require('fs');
let code = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8');

const target = `                            await clearDirectMessagesServer(threadId);`;
const replacement = `                            await clearDirectMessagesServer(threadId, currentUser.username, activeChatUser.username);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', code);
