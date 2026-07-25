const fs = require('fs');
let code = fs.readFileSync('api/server.ts', 'utf8');

const target = `  res.json({ success: true, message: 'Пользователь заблокирован' });
});`;

const replacement = `  res.json({ success: true, message: 'Пользователь заблокирован' });
});

// UNBLOCK USER
app.post('/api/friends/unblock', async (req, res) => {
  const { currentLogin, targetLogin } = req.body;
  if (!currentLogin || !targetLogin) {
    return res.status(400).json({ success: false, error: 'Не указаны данные' });
  }

  const normCurrent = currentLogin.trim().toLowerCase();
  const normTarget = targetLogin.trim().toLowerCase();

  const me = await ensureUserExists(normCurrent);
  if (me.blockedLogins) {
    me.blockedLogins = me.blockedLogins.filter((l) => l.toLowerCase() !== normTarget);
    await saveUser(me);
  }

  res.json({ success: true, message: 'Пользователь разблокирован' });
});`;

if (code.includes(target)) {
  console.log("Found target in api/server.ts");
} else {
  console.log("Target not found...");
}
code = code.replace(target, replacement);
fs.writeFileSync('api/server.ts', code);
