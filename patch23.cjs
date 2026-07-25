const fs = require('fs');
let code = fs.readFileSync('src/entities/chat/chatStore.ts', 'utf8');

const target1 = `  clearDirectMessagesServer: (threadId: string) => Promise<void>;`;
const replacement1 = `  clearDirectMessagesServer: (threadId: string, currentUsername: string, targetUsername: string) => Promise<void>;`;

const target2 = `  clearDirectMessagesServer: async (threadId: string) => {
    try {
      const res = await fetch(API_BASE + '/api/chat/direct/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId })
      });`;
const replacement2 = `  clearDirectMessagesServer: async (threadId: string, currentUsername: string, targetUsername: string) => {
    try {
      const res = await fetch(API_BASE + '/api/chat/direct/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername, targetUsername })
      });`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/entities/chat/chatStore.ts', code);
