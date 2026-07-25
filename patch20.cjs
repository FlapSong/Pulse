const fs = require('fs');
let code = fs.readFileSync('src/entities/chat/chatStore.ts', 'utf8');

const target = `            const prevMsgs = state.messagesByChannel[threadId];
            const isFirstFetchForThread = prevMsgs === undefined;
            const prevMsgsArr = prevMsgs || [];`;

const replacement = `            const isDev = useGameStore.getState().isDevMode;
            const TEST_LOGINS = ['phantom', 'cyber_friend', 'pro_gamer_777', 'speed_demon', 'shadow_ninja', 'aim_master', 'neon_pulse'];
            
            // Filter out threads from test users if not in dev mode
            if (!isDev) {
              const otherUser = threadId.split('-').find(u => u !== 'dm' && u !== currentUsername.toLowerCase());
              if (otherUser && TEST_LOGINS.includes(otherUser)) {
                return;
              }
            }

            const prevMsgs = state.messagesByChannel[threadId];
            const isFirstFetchForThread = prevMsgs === undefined;
            const prevMsgsArr = prevMsgs || [];`;

code = code.replace(target, replacement);

const targetImport = `import { useUserStore } from '../user/userStore';`;
const replacementImport = `import { useUserStore } from '../user/userStore';\nimport { useGameStore } from '../game/gameStore';`;

code = code.replace(targetImport, replacementImport);

fs.writeFileSync('src/entities/chat/chatStore.ts', code);
