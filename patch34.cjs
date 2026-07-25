const fs = require('fs');
let code = fs.readFileSync('src/widgets/chat-area/ChatArea.tsx', 'utf8');

const target = `                {/* Message Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">`;
const replacement = `                {/* Message Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex items-center justify-end flex-row-reverse gap-1.5 mt-2 flex-wrap">`;

code = code.replace(target, replacement);

fs.writeFileSync('src/widgets/chat-area/ChatArea.tsx', code);
