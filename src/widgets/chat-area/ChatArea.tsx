import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Hash,
  Search,
  Pin,
  Users,
  Volume2,
  Reply,
  FileCode,
  Download, X,
} from 'lucide-react';
import { useCommunityStore } from '../../entities/community/communityStore';
import { useChatStore } from '../../entities/chat/chatStore';
import { useUserStore } from '../../entities/user/userStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { ChatInput } from '../../features/chat-input/ChatInput';
import { Avatar } from '../../shared/ui/Avatar';

interface ChatAreaProps {
  onToggleMembers: () => void;
  showMembers: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onToggleMembers, showMembers }) => {
  const { getActiveChannel, searchQuery, setSearchQuery } = useCommunityStore();
  const { messagesByChannel, toggleReaction, togglePinMessage, setReplyingToMessage } =
    useChatStore();
  const { currentUser, friends } = useUserStore();
  const { connectToVoice } = useVoiceStore();

  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = getActiveChannel();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByChannel, activeChannel]);

  if (!activeChannel) {
    return (
      <div className="flex-1 bg-transparent flex items-center justify-center text-[#A1A1AA] text-xs font-semibold">
        Выберите канал в меню слева для начала общения.
      </div>
    );
  }

  const rawMessages = messagesByChannel[activeChannel.id] || [];
  const filteredMessages = rawMessages.filter((msg) => {
    if (showPinnedOnly && !msg.isPinned) return false;
    if (
      searchQuery.trim() &&
      !msg.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !msg.author.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 bg-transparent flex flex-col h-full overflow-hidden">
      {/* Top Channel Bar */}
      <div className="h-14 px-4 bg-[#111113] border-b border-white/[0.06] flex items-center justify-between z-10 flex-shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <Hash className="w-4 h-4 text-[#22D3EE] flex-shrink-0" />
          <div className="truncate">
            <h1 className="text-xs font-bold text-[#F5F5F7] flex items-center gap-2">
              {activeChannel.name}
            </h1>
            {activeChannel.topic && (
              <p className="text-[11px] text-[#A1A1AA] truncate max-w-md">
                {activeChannel.topic}
              </p>
            )}
          </div>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Voice Squad Launcher */}
          {activeChannel.type === 'voice' && (
            <button
              onClick={() => connectToVoice(activeChannel.id, activeChannel.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] text-xs font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Войти в голос</span>
            </button>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по каналу..."
              className="bg-[#17171C] text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/40 rounded-xl pl-8 pr-3 py-1.5 border border-white/[0.08] focus:outline-none focus:border-[#22D3EE] w-36 focus:w-48 transition-all"
            />
          </div>

          {/* Pinned Filter Toggle */}
          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            title="Закрепленные сообщения"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showPinnedOnly
                ? 'bg-[#22D3EE]/20 border-[#22D3EE]/40 text-[#22D3EE]'
                : 'bg-[#17171C] border-white/[0.08] text-[#A1A1AA] hover:text-[#F5F5F7]'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Members Sidebar */}
          <button
            onClick={onToggleMembers}
            title="Список участников"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showMembers
                ? 'bg-[#22D3EE]/20 border-[#22D3EE]/40 text-[#22D3EE]'
                : 'bg-[#17171C] border-white/[0.08] text-[#A1A1AA] hover:text-[#F5F5F7]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-3 no-scrollbar">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-10 h-10 rounded-2xl bg-[#17171C] border border-white/[0.08] flex items-center justify-center text-[#22D3EE] mb-2">
              <Hash className="w-5 h-5 text-[#22D3EE]" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F5F7] mb-1">
              Добро пожаловать в #{activeChannel.name}!
            </h3>
            <p className="text-xs text-[#A1A1AA] max-w-sm">
              Начало истории канала #{activeChannel.name}. Будьте вежливы и хорошей игры!
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`
                group relative flex gap-3 p-3 rounded-2xl transition-all duration-150 hover:bg-[#17171C]/80 border border-transparent hover:border-white/[0.06]
                ${msg.isPinned ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30' : ''}
              `}
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
                </div>

                {/* Replying Snippet */}
                {msg.replyTo && (
                  <div className="mb-1.5 pl-2 border-l-2 border-[#22D3EE] text-xs text-[#A1A1AA] flex items-center gap-1.5">
                    <span className="text-[#22D3EE] font-semibold">
                      @{msg.replyTo.authorName}:
                    </span>
                    <span className="italic truncate">{msg.replyTo.contentSnippet}</span>
                  </div>
                )}

                {/* Message Body */}
                <div className="text-xs text-[#F5F5F7] leading-relaxed break-words">
                  {msg.content}
                </div>

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2 max-w-md">
                    {msg.attachments.map((att) => (
                      <div key={att.id}>
                        {att.type === 'image' && (
                          <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#111113] relative group/att">
                            <img
                              src={att.url}
                              alt={att.name || 'image'}
                              className="max-h-64 object-contain cursor-pointer hover:opacity-95 transition-opacity w-full"
                              onClick={() => setLightboxImage(att.url)}
                              title="Открыть фото в полном размере"
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover/att:opacity-100 transition-opacity">
                              <a
                                href={att.url}
                                download={att.name || 'image.png'}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-[10px] font-bold backdrop-blur-md flex items-center gap-1 border border-white/20 shadow-lg cursor-pointer"
                                title="Скачать фото"
                              >
                                <Download className="w-3 h-3 text-[#22D3EE]" />
                                <span>Скачать</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {att.type === 'video' && (
                          <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#111113] relative group/att p-1">
                            <video
                              src={att.url}
                              controls
                              className="rounded-xl overflow-hidden w-full max-h-64"
                            />
                            <div className="flex items-center justify-between px-2 py-1.5 mt-1 border-t border-white/5">
                              <span className="text-[10px] text-[#A1A1AA] truncate">{att.name || 'Видео'}</span>
                              <a
                                href={att.url}
                                download={att.name || 'video.mp4'}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition-all border border-white/10 cursor-pointer"
                                title="Скачать видео"
                              >
                                <Download className="w-3 h-3 text-[#22D3EE]" />
                                <span>Скачать</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {att.type === 'audio' && (
                          <div className="p-2.5 rounded-2xl bg-[#111113] border border-white/[0.08] space-y-2 max-w-xs">
                            <audio
                              src={att.url}
                              controls
                              className="w-full bg-transparent rounded-lg"
                            />
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] text-[#A1A1AA] truncate">{att.name || 'Аудиозапись'}</span>
                              <a
                                href={att.url}
                                download={att.name || 'audio.mp3'}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 text-[#22D3EE] text-[10px] font-bold flex items-center gap-1 transition-all border border-[#22D3EE]/30 cursor-pointer"
                                title="Скачать аудио"
                              >
                                <Download className="w-3 h-3" />
                                <span>Скачать</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {att.type === 'file' && (
                          <a
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all max-w-sm text-left group cursor-pointer"
                          >
                            <div className="p-2 rounded-xl bg-[#22D3EE]/10 text-[#22D3EE] group-hover:bg-[#22D3EE]/20 transition-colors">
                              <FileCode className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#F5F5F7] truncate">{att.name}</p>
                              <p className="text-[10px] text-[#A1A1AA]">Файл</p>
                            </div>
                            <span className="px-3 py-1.5 rounded-lg bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 text-[#22D3EE] text-xs font-bold flex items-center gap-1.5 transition-all border border-[#22D3EE]/30">
                              <Download className="w-3.5 h-3.5" />
                              <span>Скачать</span>
                            </span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {msg.reactions.map((react) => {
                      const hasReacted = react.users.includes(currentUser.id);
                      return (
                        <button
                          key={react.emoji}
                          onClick={() =>
                            toggleReaction(activeChannel.id, msg.id, react.emoji, currentUser.id)
                          }
                          className={`
                            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono transition-all cursor-pointer
                            ${
                              hasReacted
                                ? 'bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] font-bold'
                                : 'bg-[#17171C] border border-white/[0.08] text-[#A1A1AA] hover:text-[#F5F5F7]'
                            }
                          `}
                        >
                          <span>{react.emoji}</span>
                          <span>{react.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Floating Action Menu on Message Hover */}
              <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111113] border border-white/[0.08] rounded-xl p-1 shadow-2xl flex items-center gap-1">
                <button
                  onClick={() =>
                    toggleReaction(activeChannel.id, msg.id, '⚡', currentUser.id)
                  }
                  title="Pulse Reaction"
                  className="p-1 hover:bg-white/[0.08] rounded-lg text-xs cursor-pointer"
                >
                  ⚡
                </button>
                <button
                  onClick={() =>
                    toggleReaction(activeChannel.id, msg.id, '🎯', currentUser.id)
                  }
                  title="Target Reaction"
                  className="p-1 hover:bg-white/[0.08] rounded-lg text-xs cursor-pointer"
                >
                  🎯
                </button>
                <button
                  onClick={() => setReplyingToMessage(msg)}
                  title="Ответить"
                  className="p-1 hover:bg-white/[0.08] rounded-lg text-[#A1A1AA] hover:text-[#F5F5F7] cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => togglePinMessage(activeChannel.id, msg.id)}
                  title="Закрепить"
                  className="p-1 hover:bg-white/[0.08] rounded-lg text-[#A1A1AA] hover:text-[#22D3EE] cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <ChatInput channelId={activeChannel.id} channelName={activeChannel.name} />

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-rose-500 transition-colors cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Full screen" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
