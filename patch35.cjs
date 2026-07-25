const fs = require('fs');
let code = fs.readFileSync('src/widgets/chat-area/ChatArea.tsx', 'utf8');

const target = `              {/* Floating Action Menu on Message Hover */}
              <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111113] border border-white/[0.08] rounded-xl p-1 shadow-2xl flex items-center gap-1">`;
const replacement = `              {/* Floating Action Menu on Message Hover */}
              <div className="absolute left-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111113] border border-white/[0.08] rounded-xl p-1 shadow-2xl flex items-center gap-1 flex-row-reverse">`;

code = code.replace(target, replacement);

fs.writeFileSync('src/widgets/chat-area/ChatArea.tsx', code);
