const fs = require('fs');
let code = fs.readFileSync('src/entities/user/userStore.ts', 'utf8');

const target = `            soundService.playMessage();
          }
          
          const fetchedFriends = data.friends || [];

          set({
            friends: fetchedFriends,`;

const replacement = `            soundService.playMessage();
          }
          
          let fetchedFriends = data.friends || [];
          const isDev = useGameStore.getState().isDevMode;
          const TEST_LOGINS = ['phantom', 'cyber_friend', 'pro_gamer_777', 'speed_demon', 'shadow_ninja', 'aim_master', 'neon_pulse'];
          if (!isDev) {
            fetchedFriends = fetchedFriends.filter((f: any) => !TEST_LOGINS.includes((f.username || '').toLowerCase()));
          }

          set({
            friends: fetchedFriends,`;

if (code.includes(target)) {
  console.log("Found target!");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('src/entities/user/userStore.ts', code);
