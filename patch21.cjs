const fs = require('fs');
let code = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8');

const toMove = `  const hasBlockedMe = activeChatUser ? (blockedByLogins || []).includes(activeChatUser.username.toLowerCase()) : false;
  const isBlockedByMe = activeChatUser ? (blockedLogins || []).includes(activeChatUser.username.toLowerCase()) : false;
`;

code = code.replace(toMove, "");

const insertAfter = `  const {
    messagesByChannel,
    sendMessage,
    fetchDirectMessages,
    toggleReaction,
    activeChatUser,
    setActiveChatUser,
    incrementUnreadCount,
    markAsRead,
    simulateIncomingMessage,
    clearDirectMessagesServer
  } = useChatStore();`;

code = code.replace(insertAfter, insertAfter + "\n\n" + toMove);

fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', code);
