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
  Download, X, ArrowDown, Trash2, Copy, Edit, Check, MousePointerClick
} from 'lucide-react';
import { useCommunityStore } from '../../entities/community/communityStore';
import { useChatStore } from '../../entities/chat/chatStore';
import { useUserStore } from '../../entities/user/userStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { ChatInput } from '../../features/chat-input/ChatInput';
import { Avatar } from '../../shared/ui/Avatar';
import { Message } from '../../shared/types';

interface ChatAreaProps {
  onToggleMembers: () => void;
  showMembers: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onToggleMembers, showMembers }) => {
  const { getActiveChannel, searchQuery, setSearchQuery } = useCommunityStore();
  const { messagesByChannel, fetchChannelMessages, toggleReaction, togglePinMessage, deleteMessage, editMessage, setReplyingToMessage } =
    useChatStore();
  const { currentUser, friends } = useUserStore();
  const { connectToVoice } = useVoiceStore();

  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
    senderId: string;
    messageText: string;
    isPinned: boolean;
    messageObj: Message;
  } | null>(null);

  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
    };
  }, []);

  const showContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 180;
    const menuHeight = 160;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenu({
      x,
      y,
      messageId: msg.id,
      senderId: msg.author.id,
      messageText: msg.content,
      isPinned: !!msg.isPinned,
      messageObj: msg
    });
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const prevMessagesCountRef = useRef<number>(0);
  const prevLastMessageIdRef = useRef<string | null>(null);

  const activeChannel = getActiveChannel();

  // Scroll handler to check if user scrolled up
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    // Within 150px is considered near the bottom
    const nearBottom = distanceFromBottom < 150;
    setIsNearBottom(nearBottom);

    // Show button if scrolled up more than 350px
    setShowScrollBottomBtn(distanceFromBottom > 350);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsNearBottom(true);
    setShowScrollBottomBtn(false);
  };

  // Auto-scroll on messages change - ONLY if there's a new message and we are near the bottom or it is ours
  useEffect(() => {
    if (!activeChannel) return;
    const rawMessages = messagesByChannel[activeChannel.id] || [];
    const currentCount = rawMessages.length;
    const currentLastMessage = rawMessages[currentCount - 1];
    const currentLastId = currentLastMessage?.id || null;

    // Check if a new message actually arrived
    const isNewMessage = currentCount > prevMessagesCountRef.current || (currentLastId !== null && currentLastId !== prevLastMessageIdRef.current);

    // Update refs
    prevMessagesCountRef.current = currentCount;
    prevLastMessageIdRef.current = currentLastId;

    if (isNewMessage) {
      const isLastMessageMine = currentLastMessage?.author?.id === currentUser?.id || currentLastMessage?.author?.username === currentUser?.username;
      
      if (isNearBottom || isLastMessageMine) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 30);
      }
    }
  }, [messagesByChannel, activeChannel, isNearBottom, currentUser]);

  // Reset scroll and force to bottom on active channel change
  useEffect(() => {
    if (activeChannel?.id) {
      const rawMessages = messagesByChannel[activeChannel.id] || [];
      prevMessagesCountRef.current = rawMessages.length;
      prevLastMessageIdRef.current = rawMessages[rawMessages.length - 1]?.id || null;

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' as any });
        setIsNearBottom(true);
        setShowScrollBottomBtn(false);
      }, 50);
    }
  }, [activeChannel?.id]);

  useEffect(() => {
    if (!activeChannel?.id) return;
    fetchChannelMessages(activeChannel.id);
    const interval = setInterval(() => {
      fetchChannelMessages(activeChannel.id);
    }, 1500);
    return () => clearInterval(interval);
  }, [activeChannel?.id, fetchChannelMessages]);

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
      <div className="h-14 px-4 bg-[#111113]/80 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between z-10 flex-shrink-0 select-none">
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
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 pb-32 flex flex-col gap-1 no-scrollbar"
      >
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
          filteredMessages.map((msg, index) => {
            const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
            const isConsecutive = prevMsg && 
                                 (prevMsg.author.id === msg.author.id || prevMsg.author.username === msg.author.username) && 
                                 !msg.isPinned && 
                                 !prevMsg.isPinned &&
                                 !msg.replyTo;
            const shortTime = msg.timestamp.match(/\d{2}:\d{2}/)?.[0] || msg.timestamp;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onContextMenu={(e) => showContextMenu(e, msg)}
                className={`
                  group relative flex gap-3 transition-all duration-150 hover:cursor-context-menu border border-transparent
                  ${isConsecutive 
                    ? 'px-3 py-1 rounded-xl hover:bg-[#17171C]/60 hover:border-white/[0.04]' 
                    : `p-3 rounded-2xl hover:bg-[#17171C]/80 hover:border-white/[0.06] ${msg.isPinned ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30' : ''}`
                  }
                  ${!isConsecutive && index > 0 ? 'mt-3' : ''}
                `}
              >
                {isConsecutive ? (
                  <div className="w-9 h-5 flex-shrink-0 flex items-center justify-center text-right text-[9px] text-[#A1A1AA]/50 select-none">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      {shortTime}
                    </span>
                  </div>
                ) : (
                  <Avatar
                    src={msg.author.avatar}
                    alt={msg.author.displayName}
                    status={msg.author.id === currentUser.id ? currentUser.status : (friends.find(f => f.id === msg.author.id)?.status || msg.author.status)}
                    size="md"
                  />
                )}

                <div className="flex flex-col items-start max-w-[85%] relative">
                  {/* Top-right hover indicator */}
                  <div className="absolute right-0 -top-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[9px] font-semibold text-amber-400 bg-[#111113]/90 border border-amber-500/30 px-1.5 py-0.5 rounded-md pointer-events-none z-10 select-none shadow-md">
                    ПКМ
                  </div>
                  {/* Header */}
                  {!isConsecutive && (
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
                  )}

                  {/* Replying Snippet */}
                  {!isConsecutive && msg.replyTo && (
                    <div className="mb-1.5 pr-2 border-r-2 border-[#22D3EE] text-xs text-[#A1A1AA] flex items-center justify-end gap-1.5 flex-row-reverse">
                      <span className="text-[#22D3EE] font-semibold">
                        @{msg.replyTo.authorName}:
                      </span>
                      <span className="italic truncate">{msg.replyTo.contentSnippet}</span>
                    </div>
                  )}

                  {/* Message Body */}
                {editingMessageId === msg.id ? (
                  <div className="flex flex-col gap-2.5 my-1 bg-[#121215] border border-[#22D3EE]/30 rounded-2xl p-3 shadow-xl backdrop-blur-md" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-[11px] text-[#22D3EE] font-semibold px-1">
                      <span className="flex items-center gap-1.5">
                        <Edit className="w-3 h-3" /> Редактирование сообщения
                      </span>
                      <span className="text-[10px] text-[#A1A1AA]">Esc для отмены, Enter ↵ для сохранения</span>
                    </div>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          editMessage(activeChannel.id, msg.id, editingText, currentUser.id);
                          setEditingMessageId(null);
                        } else if (e.key === 'Escape') {
                          setEditingMessageId(null);
                        }
                      }}
                      className="w-full bg-[#18181B] border border-white/10 focus:border-[#22D3EE] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F7] outline-none resize-none min-h-[64px] shadow-inner transition-colors"
                      placeholder="Введите новый текст..."
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Отмена</span>
                      </button>
                      <button
                        onClick={() => {
                          editMessage(activeChannel.id, msg.id, editingText, currentUser.id);
                          setEditingMessageId(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Сохранить</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#F5F5F7] leading-relaxed break-words">
                    {msg.content}
                  </div>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2 max-w-md ml-auto">
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

                </div>

              {/* Floating Action Menu on Message Hover */}
              <div className="absolute left-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111113] border border-white/[0.08] rounded-xl p-1 shadow-2xl flex items-center gap-1 flex-row-reverse">
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
          ); })
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBottomBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] font-bold text-xs py-2 px-3.5 rounded-full shadow-2xl shadow-[#22D3EE]/30 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 z-40 border border-cyan-400 cursor-pointer"
        >
          <ArrowDown className="w-4 h-4 animate-bounce" />
          <span>Вниз</span>
        </button>
      )}

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

      {/* Message Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed bg-[#09090B] border border-white/[0.08] rounded-xl p-1 shadow-2xl z-[100] flex flex-col min-w-[170px] animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setReplyingToMessage(contextMenu.messageObj);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5 rounded-lg text-left cursor-pointer transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Ответить</span>
          </button>
          
          <button
            onClick={() => {
              togglePinMessage(activeChannel.id, contextMenu.messageId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#A1A1AA] hover:text-[#22D3EE] hover:bg-white/5 rounded-lg text-left cursor-pointer transition-colors"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>{contextMenu.isPinned ? 'Открепить' : 'Закрепить'}</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.messageText);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5 rounded-lg text-left cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Копировать текст</span>
          </button>

          {(String(contextMenu.senderId) === String(currentUser.id) || 
            (contextMenu.messageObj?.author?.username && contextMenu.messageObj.author.username === currentUser.username)) && (
            <>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => {
                  setEditingMessageId(contextMenu.messageId);
                  setEditingText(contextMenu.messageText);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#A1A1AA] hover:text-[#22D3EE] hover:bg-white/5 rounded-lg text-left cursor-pointer transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Редактировать</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Вы уверены, что хотите удалить это сообщение для всех?')) {
                    deleteMessage(activeChannel.id, contextMenu.messageId, currentUser.id);
                  }
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-left cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить сообщение</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
