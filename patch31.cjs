const fs = require('fs');
let code = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8');

const target1 = `                      className={\`flex items-start gap-3 group max-w-2xl \${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}\`}`;
const replacement1 = `                      className="flex items-start gap-3 group max-w-2xl ml-auto flex-row-reverse text-right"`;

const target2 = `                        <div className={\`flex items-center gap-2 \${isMe ? 'flex-row-reverse' : 'flex-row'}\`}>`;
const replacement2 = `                        <div className="flex items-center gap-2 flex-row-reverse">`;

const target3 = `                        <div className={\`p-3.5 rounded-2xl border text-xs leading-relaxed \${
                          isMe 
                            ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30 text-[#F5F5F7] rounded-tr-none' 
                            : 'bg-[#18181B] border-white/10 text-[#F5F5F7] rounded-tl-none'
                        }\`}>`;
const replacement3 = `                        <div className={\`p-3.5 rounded-2xl border text-xs leading-relaxed text-right \${
                          isMe 
                            ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30 text-[#F5F5F7] rounded-tr-none' 
                            : 'bg-[#18181B] border-white/10 text-[#F5F5F7] rounded-tr-none'
                        }\`}>`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);

fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', code);
