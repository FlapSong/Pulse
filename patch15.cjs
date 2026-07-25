const fs = require('fs');
let code = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8');

const target = `    removeFriendServer,
    blockUserServer,
    setStatus,
    setCustomStatus
  } = useUserStore();`;

const replacement = `    removeFriendServer,
    blockUserServer,
    setStatus,
    setCustomStatus,
    blockedLogins,
    blockedByLogins
  } = useUserStore();`;

if (code.includes(target)) {
  console.log("Found target in FriendsView.tsx");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);

const target2 = `  const [addStatusMessage, setAddStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);`;
const replacement2 = `  const [addStatusMessage, setAddStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const hasBlockedMe = activeChatUser ? (blockedByLogins || []).includes(activeChatUser.username.toLowerCase()) : false;
  const isBlockedByMe = activeChatUser ? (blockedLogins || []).includes(activeChatUser.username.toLowerCase()) : false;
`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', code);
