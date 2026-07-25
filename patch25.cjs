const fs = require('fs');
let code = fs.readFileSync('src/entities/chat/chatStore.ts', 'utf8');

const target = `    try {
      const res = await fetch(API_BASE + '/api/chat/direct/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername, targetUsername })
      });
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          messagesByChannel: {
            ...state.messagesByChannel,
            [threadId]: []
          }
        }));
      }
    } catch (e) {
      console.error('Failed to clear direct messages:', e);
    }`;

const replacement = `    try {
      const res = await fetch(API_BASE + '/api/chat/direct/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername, targetUsername })
      });
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          messagesByChannel: {
            ...state.messagesByChannel,
            [threadId]: []
          }
        }));
      } else {
        console.error('Failed to clear direct messages (server error):', data.error);
      }
    } catch (e) {
      console.error('Failed to clear direct messages:', e);
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/entities/chat/chatStore.ts', code);
