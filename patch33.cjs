const fs = require('fs');
let code = fs.readFileSync('src/widgets/chat-area/ChatArea.tsx', 'utf8');

const target1 = `                {/* Replying Snippet */}
                {msg.replyTo && (
                  <div className="mb-1.5 pl-2 border-l-2 border-[#22D3EE] text-xs text-[#A1A1AA] flex items-center gap-1.5">
                    <span className="text-[#22D3EE] font-semibold">
                      @{msg.replyTo.authorName}:
                    </span>
                    <span className="italic truncate">{msg.replyTo.contentSnippet}</span>
                  </div>
                )}`;
const replacement1 = `                {/* Replying Snippet */}
                {msg.replyTo && (
                  <div className="mb-1.5 pr-2 border-r-2 border-[#22D3EE] text-xs text-[#A1A1AA] flex items-center justify-end gap-1.5 flex-row-reverse">
                    <span className="text-[#22D3EE] font-semibold">
                      @{msg.replyTo.authorName}:
                    </span>
                    <span className="italic truncate">{msg.replyTo.contentSnippet}</span>
                  </div>
                )}`;

const target2 = `                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2 max-w-md">`;
const replacement2 = `                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2 max-w-md ml-auto">`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/widgets/chat-area/ChatArea.tsx', code);
