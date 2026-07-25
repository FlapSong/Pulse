const fs = require('fs');
let code = fs.readFileSync('api/server.ts', 'utf8');

const target = `app.post('/api/chat/direct/clear', async (req, res) => {
  const { threadId } = req.body;
  if (!threadId) {
    return res.status(400).json({ success: false, error: 'threadId required' });
  }

  try {
    await execSql('DELETE FROM direct_messages WHERE thread_id = ?', [threadId]);
    res.json({ success: true, message: 'История чата успешно очищена' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

const replacement = `app.post('/api/chat/direct/clear', async (req, res) => {
  const { currentUsername, targetUsername } = req.body;
  if (!currentUsername || !targetUsername) {
    return res.status(400).json({ success: false, error: 'Usernames required' });
  }

  try {
    const cleanCurrent = currentUsername.toLowerCase();
    const cleanTarget = targetUsername.toLowerCase();
    await execSql(
      'DELETE FROM direct_messages WHERE (LOWER(sender_id) = ? AND LOWER(recipient_id) = ?) OR (LOWER(sender_id) = ? AND LOWER(recipient_id) = ?)',
      [cleanCurrent, cleanTarget, cleanTarget, cleanCurrent]
    );
    res.json({ success: true, message: 'История чата успешно очищена' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

code = code.replace(target, replacement);
fs.writeFileSync('api/server.ts', code);
