import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, ShieldAlert, CheckCircle2, Clock, RefreshCw, Copy, Check } from 'lucide-react';
import { useUserStore } from '../../entities/user/userStore';

export const InboxModal: React.FC = () => {
  const {
    inboxModalOpen,
    setInboxModalOpen,
    userInbox,
    currentUser,
    pendingVerification,
    fetchUserInbox
  } = useUserStore();

  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [emailSearch, setEmailSearch] = React.useState('');

  useEffect(() => {
    if (inboxModalOpen) {
      const target =
        pendingVerification?.email ||
        currentUser.email ||
        (currentUser.username ? `${currentUser.username}@pulse.gg` : '');
      setEmailSearch(target);
      fetchUserInbox(target);
    }
  }, [inboxModalOpen]);

  if (!inboxModalOpen) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleFetchCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (emailSearch.trim()) {
      fetchUserInbox(emailSearch.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090B]/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-[#17171C] border border-white/[0.12] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#111113]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
                Входящие письма (Почта)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30">
                  {userInbox.length}
                </span>
              </h3>
              <p className="text-xs text-[#A1A1AA]">
                Почтовый сервер Pulse HQ для получения кодов авторизации
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFetchCustom()}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-[#A1A1AA] hover:text-[#F5F5F7] transition-all cursor-pointer"
              title="Обновить почту"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setInboxModalOpen(false)}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-[#A1A1AA] hover:text-[#F5F5F7] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Address Switcher Bar */}
        <form
          onSubmit={handleFetchCustom}
          className="px-5 py-2.5 bg-[#111113]/90 border-b border-white/[0.06] flex items-center gap-2"
        >
          <span className="text-xs font-bold text-[#A1A1AA] shrink-0">Email ящик:</span>
          <input
            type="text"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            placeholder="geytima623@gmail.com или alex@pulse.gg"
            className="flex-1 bg-[#17171C] border border-white/[0.08] focus:border-[#22D3EE] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F7] font-mono focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-[#22D3EE] text-[#09090B] font-bold text-xs hover:bg-[#06b6d4] transition-colors cursor-pointer shrink-0"
          >
            Проверить
          </button>
        </form>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 no-scrollbar">
          {userInbox.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Mail className="w-12 h-12 text-[#A1A1AA]/30 mx-auto" />
              <p className="text-sm font-medium text-[#A1A1AA]">Входящих писем пока нет</p>
              <p className="text-xs text-[#A1A1AA]/60 max-w-xs mx-auto">
                При регистрации, входе в аккаунт или сбросе пароля сюда будут приходить письма и коды подтверждения.
              </p>
            </div>
          ) : (
            userInbox.map((mail) => (
              <div
                key={mail.id}
                className="p-4 rounded-2xl bg-[#111113] border border-white/[0.08] hover:border-[#22D3EE]/40 transition-all space-y-2.5 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {mail.type === 'verification' ? (
                      <span className="p-1.5 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE]">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-[#F5F5F7]">{mail.subject}</h4>
                  </div>

                  <span className="text-[10px] font-mono text-[#A1A1AA]/60 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(mail.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs text-[#A1A1AA] whitespace-pre-line leading-relaxed pl-8">
                  {mail.body}
                </p>

                {mail.code && (
                  <div className="ml-8 mt-2 p-2.5 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#A1A1AA] uppercase font-bold">
                        Код верификации:
                      </span>
                      <span className="text-sm font-mono font-black text-[#22D3EE] tracking-widest">
                        {mail.code}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(mail.code!)}
                      className="px-2.5 py-1 rounded-lg bg-[#22D3EE] text-[#09090B] font-bold text-[10px] flex items-center gap-1 hover:bg-[#06b6d4] transition-colors cursor-pointer"
                    >
                      {copiedCode === mail.code ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Скопировать</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
