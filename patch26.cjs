const fs = require('fs');
let code = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8');

const stateTarget = `  const [showChatMenu, setShowChatMenu] = useState(false);`;
const stateReplacement = `  const [showChatMenu, setShowChatMenu] = useState(false);\n  const [confirmingAction, setConfirmingAction] = useState<'clear' | 'remove' | 'block' | null>(null);`;
code = code.replace(stateTarget, stateReplacement);

const menuTarget = `                    <button
                      onClick={async () => {
                        setShowChatMenu(false);
                        if (currentUser?.username && activeChatUser) {
                          const threadId = ['dm', currentUser.username, activeChatUser.username].sort().join('-');
                          if (confirm('Вы уверены, что хотите очистить всю историю сообщений в этом чате?')) {
                            await clearDirectMessagesServer(threadId, currentUser.username, activeChatUser.username);
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#E4E4E7] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Очистить чат</span>
                    </button>

                    <button
                      onClick={async () => {
                        setShowChatMenu(false);
                        if (confirm(\`Вы уверены, что хотите удалить @\${activeChatUser.username} из списка друзей?\`)) {
                          const res = await removeFriendServer(activeChatUser.username);
                          if (res.success) {
                            setActiveChatUser(null);
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <UserMinus className="w-4 h-4 shrink-0" />
                      <span>Удалить из друзей</span>
                    </button>

                    <button
                      onClick={async () => {
                        setShowChatMenu(false);
                        if (confirm(\`Заблокировать @\${activeChatUser.username}?\`)) {
                          const res = await blockUserServer(activeChatUser.username);
                          if (res.success) {
                            setActiveChatUser(null);
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Заблокировать</span>
                    </button>`;

const menuReplacement = `                    {confirmingAction ? (
                      <div className="px-2 py-2 text-xs">
                        <p className="text-[#F5F5F7] mb-2 text-center leading-relaxed">
                          {confirmingAction === 'clear' ? 'Очистить историю сообщений?' : confirmingAction === 'remove' ? 'Удалить из друзей?' : 'Заблокировать?'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (confirmingAction === 'clear' && currentUser?.username && activeChatUser) {
                                const threadId = ['dm', currentUser.username, activeChatUser.username].sort().join('-');
                                await clearDirectMessagesServer(threadId, currentUser.username, activeChatUser.username);
                              } else if (confirmingAction === 'remove' && activeChatUser) {
                                const res = await removeFriendServer(activeChatUser.username);
                                if (res.success) setActiveChatUser(null);
                              } else if (confirmingAction === 'block' && activeChatUser) {
                                const res = await blockUserServer(activeChatUser.username);
                                if (res.success) setActiveChatUser(null);
                              }
                              setConfirmingAction(null);
                              setShowChatMenu(false);
                            }}
                            className="flex-1 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg font-bold hover:bg-rose-500/30 transition-colors cursor-pointer"
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setConfirmingAction(null)}
                            className="flex-1 py-1.5 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmingAction('clear')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#E4E4E7] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Очистить чат</span>
                        </button>

                        <button
                          onClick={() => setConfirmingAction('remove')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4 shrink-0" />
                          <span>Удалить из друзей</span>
                        </button>

                        <button
                          onClick={() => setConfirmingAction('block')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Заблокировать</span>
                        </button>
                      </>
                    )}`;
code = code.replace(menuTarget, menuReplacement);

const outsideClickTarget = `        setShowChatMenu(false);
      }`;
const outsideClickReplacement = `        setShowChatMenu(false);
        setConfirmingAction(null);
      }`;
code = code.replace(outsideClickTarget, outsideClickReplacement);

fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', code);
