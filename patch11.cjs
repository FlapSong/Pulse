const fs = require('fs');
let code = fs.readFileSync('src/entities/user/userStore.ts', 'utf8');

const target = `    unblockUserServer: async (targetLogin: string) => {
      set((state) => ({
        blockedLogins: state.blockedLogins.filter(l => l !== targetLogin)
      }));
      return { success: true, message: 'Пользователь разблокирован' };
    },`;

const replacement = `    unblockUserServer: async (targetLogin: string) => {
      const { currentUser } = get();
      try {
        const res = await fetch(API_BASE + '/api/friends/unblock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentLogin: currentUser.username, targetLogin })
        });
        const data = await res.json();
        if (data.success) {
          set((state) => ({
            blockedLogins: state.blockedLogins.filter(l => l !== targetLogin)
          }));
          return { success: true, message: data.message || 'Пользователь разблокирован' };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка при разблокировке' };
      }
    },`;

if (code.includes(target)) {
  console.log("Found target in userStore.ts");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('src/entities/user/userStore.ts', code);
