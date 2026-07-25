const fs = require('fs');
let code = fs.readFileSync('src/entities/user/userStore.ts', 'utf8');

const target = `        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          set({ searchResults: data.users });
        }`;

const replacement = `        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          let users = data.users;
          const isDev = useGameStore.getState().isDevMode;
          const TEST_LOGINS = ['phantom', 'cyber_friend', 'pro_gamer_777', 'speed_demon', 'shadow_ninja', 'aim_master', 'neon_pulse'];
          if (!isDev) {
            users = users.filter((u: any) => !TEST_LOGINS.includes((u.username || '').toLowerCase()));
          }
          set({ searchResults: users });
        }`;

if (code.includes(target)) {
  console.log("Found target!");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('src/entities/user/userStore.ts', code);
