const fs = require('fs');
let code = fs.readFileSync('src/entities/chat/chatStore.ts', 'utf8');

const target = `            const prevMsgs = state.messagesByChannel[threadId] || [];

            if (newMsgs.length > prevMsgs.length) {
              const freshMsgs = newMsgs.slice(prevMsgs.length);
              const incomingFresh = freshMsgs.filter(
                (m) => m.author?.username?.toLowerCase() !== currentUsername.toLowerCase()
              );

              if (incomingFresh.length > 0) {
                shouldPlaySound = true;

                const activeDmUsername = state.activeChatUser?.username?.toLowerCase();
                const isChattingWithThisSender =
                  isCurrentTabDm &&
                  activeDmUsername &&
                  threadId.toLowerCase().includes(activeDmUsername);

                if (!isChattingWithThisSender) {
                  updatedUnreadCounts[threadId] = (updatedUnreadCounts[threadId] || 0) + incomingFresh.length;
                }
              }
            }`;

const replacement = `            const prevMsgs = state.messagesByChannel[threadId];
            const isFirstFetchForThread = prevMsgs === undefined;
            const prevMsgsArr = prevMsgs || [];

            if (newMsgs.length > prevMsgsArr.length) {
              const freshMsgs = newMsgs.slice(prevMsgsArr.length);
              const incomingFresh = freshMsgs.filter(
                (m) => m.author?.username?.toLowerCase() !== currentUsername.toLowerCase()
              );

              if (incomingFresh.length > 0) {
                if (!isFirstFetchForThread) {
                  shouldPlaySound = true;
                }

                const activeDmUsername = state.activeChatUser?.username?.toLowerCase();
                const isChattingWithThisSender =
                  isCurrentTabDm &&
                  activeDmUsername &&
                  threadId.toLowerCase().includes(activeDmUsername);

                if (!isChattingWithThisSender) {
                  if (isFirstFetchForThread) {
                    const unreadCount = incomingFresh.filter(m => !(m as any).readStatus).length;
                    updatedUnreadCounts[threadId] = unreadCount;
                  } else {
                    updatedUnreadCounts[threadId] = (updatedUnreadCounts[threadId] || 0) + incomingFresh.length;
                  }
                }
              }
            }`;

if (code.includes(target)) {
  console.log("Found target!");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('src/entities/chat/chatStore.ts', code);
