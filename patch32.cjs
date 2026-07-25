const fs = require('fs');
let code = fs.readFileSync('src/widgets/chat-area/ChatArea.tsx', 'utf8');

const target = `              className={\`
                group relative flex gap-3 p-3 rounded-2xl transition-all duration-150 hover:bg-[#17171C]/80 border border-transparent hover:border-white/[0.06]
                \${msg.isPinned ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30' : ''}
              \`}
            >
              <Avatar
                src={msg.author.avatar}
                alt={msg.author.displayName}
                status={msg.author.id === currentUser.id ? currentUser.status : (friends.find(f => f.id === msg.author.id)?.status || msg.author.status)}
                size="md"
              />

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#F5F5F7]">
                    {msg.author.displayName}
                  </span>
                  {msg.author.badge && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 font-mono font-bold rounded bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30">
                      {msg.author.badge}
                    </span>
                  )}
                  <span className="text-[10px] text-[#A1A1AA]">{msg.timestamp}</span>
                  {msg.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] text-[#22D3EE] font-bold ml-auto bg-[#22D3EE]/10 px-2 py-0.5 rounded-full border border-[#22D3EE]/30">
                      <Pin className="w-3 h-3" /> Закреплено
                    </span>
                  )}
                </div>`;

const replacement = `              className={\`
                group relative flex gap-3 p-3 rounded-2xl transition-all duration-150 hover:bg-[#17171C]/80 border border-transparent hover:border-white/[0.06] ml-auto flex-row-reverse text-right
                \${msg.isPinned ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30' : ''}
              \`}
            >
              <Avatar
                src={msg.author.avatar}
                alt={msg.author.displayName}
                status={msg.author.id === currentUser.id ? currentUser.status : (friends.find(f => f.id === msg.author.id)?.status || msg.author.status)}
                size="md"
              />

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-end gap-2 mb-1 flex-row-reverse">
                  <span className="text-xs font-bold text-[#F5F5F7]">
                    {msg.author.displayName}
                  </span>
                  {msg.author.badge && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 font-mono font-bold rounded bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30">
                      {msg.author.badge}
                    </span>
                  )}
                  <span className="text-[10px] text-[#A1A1AA]">{msg.timestamp}</span>
                  {msg.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] text-[#22D3EE] font-bold mr-auto bg-[#22D3EE]/10 px-2 py-0.5 rounded-full border border-[#22D3EE]/30">
                      <Pin className="w-3 h-3" /> Закреплено
                    </span>
                  )}
                </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/widgets/chat-area/ChatArea.tsx', code);
