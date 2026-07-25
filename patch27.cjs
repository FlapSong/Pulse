const fs = require('fs');
let code = fs.readFileSync('src/widgets/friends-view/FriendsView.tsx', 'utf8');

const stateTarget = `  const [confirmingAction, setConfirmingAction] = useState<'clear' | 'remove' | 'block' | null>(null);`;
const stateReplacement = `  const [confirmingAction, setConfirmingAction] = useState<'clear' | 'remove' | 'block' | null>(null);\n  const [confirmingFriendAction, setConfirmingFriendAction] = useState<'remove' | 'block' | null>(null);`;
code = code.replace(stateTarget, stateReplacement);

const menuTarget = `                              <button
                                onClick={async () => {
                                  setOpenFriendMenuUsername(null);
                                  if (confirm(\`Удалить @\${friend.username} из друзей?\`)) {
                                    await removeFriendServer(friend.username);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#E4E4E7] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                              >
                                <UserMinus className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Удалить из друзей</span>
                              </button>

                              <button
                                onClick={async () => {
                                  setOpenFriendMenuUsername(null);
                                  if (confirm(\`Заблокировать @\${friend.username}?\`)) {
                                    await blockUserServer(friend.username);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                              >
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                <span>Заблокировать</span>
                              </button>`;

const menuReplacement = `                              {confirmingFriendAction ? (
                                <div className="px-2 py-2 text-xs">
                                  <p className="text-[#F5F5F7] mb-2 text-center leading-relaxed">
                                    {confirmingFriendAction === 'remove' ? 'Удалить из друзей?' : 'Заблокировать?'}
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        if (confirmingFriendAction === 'remove') {
                                          await removeFriendServer(friend.username);
                                        } else if (confirmingFriendAction === 'block') {
                                          await blockUserServer(friend.username);
                                        }
                                        setConfirmingFriendAction(null);
                                        setOpenFriendMenuUsername(null);
                                      }}
                                      className="flex-1 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg font-bold hover:bg-rose-500/30 transition-colors cursor-pointer"
                                    >
                                      Да
                                    </button>
                                    <button
                                      onClick={() => setConfirmingFriendAction(null)}
                                      className="flex-1 py-1.5 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-colors cursor-pointer"
                                    >
                                      Отмена
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setConfirmingFriendAction('remove')}
                                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 text-[#E4E4E7] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                                  >
                                    <UserMinus className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>Удалить из друзей</span>
                                  </button>
                                  <button
                                    onClick={() => setConfirmingFriendAction('block')}
                                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                                  >
                                    <ShieldCheck className="w-4 h-4 shrink-0" />
                                    <span>Заблокировать</span>
                                  </button>
                                </>
                              )}`;

code = code.replace(menuTarget, menuReplacement);

const closeFriendMenuTarget = `setOpenFriendMenuUsername(null);
                          }`;
const closeFriendMenuReplacement = `setOpenFriendMenuUsername(null);
                            setConfirmingFriendAction(null);
                          }`;
code = code.replace(closeFriendMenuTarget, closeFriendMenuReplacement);
fs.writeFileSync('src/widgets/friends-view/FriendsView.tsx', code);
