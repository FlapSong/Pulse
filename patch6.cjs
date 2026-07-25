const fs = require('fs');
let code = fs.readFileSync('src/entities/user/userStore.ts', 'utf8');

const target = `          const isDev = useGameStore.getState().isDevMode;
          const TEST_LOGINS = ['phantom', 'cyber_friend', 'pro_gamer_777', 'speed_demon', 'shadow_ninja', 'aim_master', 'neon_pulse'];
          if (!isDev) {
            fetchedFriends = fetchedFriends.filter((f: any) => !TEST_LOGINS.includes((f.username || '').toLowerCase()));
          }`;

code = code.replace(target, ""); // replace first instance? No, the second instance
fs.writeFileSync('src/entities/user/userStore.ts', code);
