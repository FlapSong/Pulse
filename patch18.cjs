const fs = require('fs');
let code = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8');

const target2 = `          <div className="flex items-center gap-2 bg-[#111113] border border-white/[0.06] focus-within:border-[#22D3EE] rounded-2xl pl-3 pr-2 py-1.5 transition-all">
            <input
              type="file"
              ref={dmFileInputRef}
              className="hidden"
              accept="image/*,video/*,audio/*,application/*,text/*"
              onChange={handleDmFileChange}
            />
            <button
              onClick={triggerDmFileInput}
              title="Прикрепить реальный медиафайл"
              className="p-2 text-[#A1A1AA] hover:text-[#22D3EE] transition-colors rounded-xl hover:bg-white/5 cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePasteDm}
              placeholder={\`Напишите личное сообщение @\${activeChatUser?.username}...\`}
              className="flex-1 bg-transparent border-none text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/30 focus:outline-none py-2 px-1"
            />
            <button
              onClick={handleSendDm}
              disabled={!chatInput.trim() && dmAttachments.length === 0}
              className="p-2.5 rounded-xl bg-[#22D3EE] disabled:opacity-30 text-[#09090B] font-bold transition-all hover:bg-[#06b6d4] disabled:hover:bg-[#22D3EE] cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>`;

const target2_fallback = `          <div className="flex items-center gap-2 bg-[#111113] border border-white/[0.06] focus-within:border-[#22D3EE] rounded-2xl pl-3 pr-2 py-1.5 transition-all">
            <input
              type="file"
              ref={dmFileInputRef}
              className="hidden"
              accept="image/*,video/*,audio/*,application/*,text/*"
              onChange={handleDmFileChange}
            />
            <button
              onClick={triggerDmFileInput}
              title="Прикрепить реальный медиафайл"
              className="p-2 text-[#A1A1AA] hover:text-[#22D3EE] transition-colors rounded-xl hover:bg-white/5 cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePasteDm}
              placeholder={\`Напишите личное сообщение @\${activeChatUser.username}...\`}
              className="flex-1 bg-transparent border-none text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/30 focus:outline-none py-2 px-1"
            />
            <button
              onClick={handleSendDm}
              disabled={!chatInput.trim() && dmAttachments.length === 0}
              className="p-2.5 rounded-xl bg-[#22D3EE] disabled:opacity-30 text-[#09090B] font-bold transition-all hover:bg-[#06b6d4] disabled:hover:bg-[#22D3EE] cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>`;

const replacement2 = `          {hasBlockedMe ? (
            <div className="flex items-center justify-center p-3 bg-[#111113] border border-white/[0.06] rounded-2xl">
              <p className="text-sm text-[#A1A1AA]">Пользователь ограничил вам доступ к сообщениям</p>
            </div>
          ) : isBlockedByMe ? (
            <div className="flex items-center justify-center p-3 bg-[#111113] border border-white/[0.06] rounded-2xl">
              <p className="text-sm text-[#A1A1AA]">Вы заблокировали этого пользователя. <button onClick={() => unblockUserServer(activeChatUser.username)} className="text-[#22D3EE] hover:underline cursor-pointer">Разблокировать</button></p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#111113] border border-white/[0.06] focus-within:border-[#22D3EE] rounded-2xl pl-3 pr-2 py-1.5 transition-all">
              <input
                type="file"
                ref={dmFileInputRef}
                className="hidden"
                accept="image/*,video/*,audio/*,application/*,text/*"
                onChange={handleDmFileChange}
              />
              <button
                onClick={triggerDmFileInput}
                title="Прикрепить реальный медиафайл"
                className="p-2 text-[#A1A1AA] hover:text-[#22D3EE] transition-colors rounded-xl hover:bg-white/5 cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePasteDm}
                placeholder={\`Напишите личное сообщение @\${activeChatUser.username}...\`}
                className="flex-1 bg-transparent border-none text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/30 focus:outline-none py-2 px-1"
              />
              <button
                onClick={handleSendDm}
                disabled={!chatInput.trim() && dmAttachments.length === 0}
                className="p-2.5 rounded-xl bg-[#22D3EE] disabled:opacity-30 text-[#09090B] font-bold transition-all hover:bg-[#06b6d4] disabled:hover:bg-[#22D3EE] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}`;

if (code.includes(target2)) {
  console.log("Found target2");
  code = code.replace(target2, replacement2);
} else if (code.includes(target2_fallback)) {
  console.log("Found target2_fallback");
  code = code.replace(target2_fallback, replacement2);
} else {
  console.log("target2 not found!");
}

fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', code);
