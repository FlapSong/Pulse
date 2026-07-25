const fs = require('fs');
let lines = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('<div className="flex items-center gap-2 bg-[#111113] border border-white/[0.06]'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('</div>'));

if (startIdx !== -1 && endIdx !== -1) {
  console.log("Found div block from", startIdx, "to", endIdx);
  const originalBlock = lines.slice(startIdx, endIdx + 1).join('\n');
  const newBlock = `          {hasBlockedMe ? (
            <div className="flex items-center justify-center p-3 bg-[#111113] border border-white/[0.06] rounded-2xl">
              <p className="text-sm text-[#A1A1AA]">Пользователь ограничил вам доступ к сообщениям</p>
            </div>
          ) : isBlockedByMe ? (
            <div className="flex items-center justify-center p-3 bg-[#111113] border border-white/[0.06] rounded-2xl">
              <p className="text-sm text-[#A1A1AA]">Вы заблокировали этого пользователя. <button onClick={() => unblockUserServer(activeChatUser.username)} className="text-[#22D3EE] hover:underline cursor-pointer">Разблокировать</button></p>
            </div>
          ) : (
\n` + originalBlock + `\n          )}`;
  
  lines.splice(startIdx, endIdx - startIdx + 1, newBlock);
  fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', lines.join('\n'));
} else {
  console.log("Not found block");
}
