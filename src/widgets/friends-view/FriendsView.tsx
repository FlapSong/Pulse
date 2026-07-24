import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Clock,
  Search,
  PhoneCall,
  MessageSquare,
  UserMinus,
  Check,
  X,
  Sparkles,
  Zap,
  PhoneOff,
  MicOff,
  Radio,
  Copy,
  Link,
  ShieldCheck,
  Edit2,
  Smile,
  Circle,
  ArrowLeft,
  Send,
  Paperclip,
  FileCode,
  ChevronUp,
  ChevronDown,
  Download
} from 'lucide-react';
import { Avatar } from '../../shared/ui/Avatar';
import { useUserStore } from '../../entities/user/userStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { useChatStore } from '../../entities/chat/chatStore';
import { AudioWaveform } from '../../shared/ui/AudioWaveform';
import { UserStatus } from '../../shared/types';

import { AnimatedBackground } from '../../shared/ui/AnimatedBackground';

export const FriendsView: React.FC = () => {
  const {
    currentUser,
    friends,
    incomingRequests,
    outgoingRequests,
    searchResults,
    fetchFriendsServer,
    searchUsersServer,
    sendFriendRequestServer,
    acceptFriendRequestServer,
    declineFriendRequestServer,
    removeFriendServer,
    blockUserServer,
    setStatus,
    setCustomStatus
  } = useUserStore();

  const {
    activeVoiceChannelId,
    roomCode,
    connectToVoice,
    disconnectVoice,
    participants,
    errorMessage
  } = useVoiceStore();

  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'add'>('online');
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addStatusMessage, setAddStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Status editing state
  const [isEditingCustomStatus, setIsEditingCustomStatus] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState(currentUser.customStatus || '');

  // Direct Message State
  const [chatInput, setChatInput] = useState('');
  const [dmAttachments, setDmAttachments] = useState<any[]>([]);
  const [isCallStageCollapsed, setIsCallStageCollapsed] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const dmFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // useChatStore
  const { messagesByChannel, sendMessage, toggleReaction, activeChatUser, setActiveChatUser, incrementUnreadCount, markAsRead } = useChatStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByChannel, activeChatUser]);

  // Initial & periodic sync
  useEffect(() => {
    fetchFriendsServer();
    const interval = setInterval(() => {
      fetchFriendsServer();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser.username]);

  // Automated reply simulation for testing direct messages
  useEffect(() => {
    if (!activeChatUser) return;
    const threadId = ['dm', currentUser.username, activeChatUser.username].sort().join('-');
    const threadMessages = messagesByChannel[threadId] || [];
    if (threadMessages.length === 0) return;

    const lastMessage = threadMessages[threadMessages.length - 1];
    // If the last message is from the logged-in user, simulate a reply
    if (lastMessage.author.id === currentUser.id) {
      const responseTimer = setTimeout(() => {
        // Double check thread status
        const currentMessages = useChatStore.getState().messagesByChannel[threadId] || [];
        const lastMsgNow = currentMessages[currentMessages.length - 1];
        if (lastMsgNow && lastMsgNow.author.id !== currentUser.id) {
          return; // Already replied or another message arrived
        }

        const botReplies = [
          `Привет! Рад тебя слышать! Оверлей Pulse на Alt + U работает просто супер! 🔥`,
          `Да, я тут! Качество связи в голосовых комнатах WebRTC отличное! 📞`,
          `Го катку прямо сейчас? Я как раз разминаюсь! 🎮`,
          `Слышно тебя отлично! Попробуй включить шумоподавление Krisp в настройках звука!`,
          `Зацени мой игровой статус! Рад тебя видеть онлайн!`,
          `Игровой HUD в оверлее считывает реальные кадры в сек и пинг, мега удобная вещь! ⚡`,
          `Привет! Как дела? Я сейчас играю, но с удовольствием потестирую с тобой функции чата!`
        ];
        const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];

        sendMessage(threadId, {
          id: activeChatUser.id,
          username: activeChatUser.username,
          displayName: activeChatUser.displayName,
          avatar: activeChatUser.avatar,
          status: activeChatUser.status || 'online',
          role: activeChatUser.role || 'Gamer',
          badge: activeChatUser.badge || 'PRO'
        }, randomReply);

        // If this chat is NOT the active one, increment unread count
        // Note: activeChatUser check is slightly redundant here because of the initial useEffect guard,
        // but in a real app where messages come from websockets, we'd check if (activeChatUser?.username !== sender.username)
        const currentActive = useChatStore.getState().activeChatUser;
        if (!currentActive || currentActive.username !== activeChatUser.username) {
            incrementUnreadCount(threadId);
        }
      }, 1500);

      return () => clearTimeout(responseTimer);
    }
  }, [activeChatUser, messagesByChannel, currentUser.id, sendMessage]);

  // Handle URL room connect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom && !activeVoiceChannelId) {
      connectToVoice(urlRoom, `Голосовой звонок (${urlRoom})`);
    }
  }, []);

  const handleStartCall = (friendUsername: string, friendDisplayName: string) => {
    const roomId = ['call', currentUser.username, friendUsername].sort().join('-');
    connectToVoice(roomId, `Звонок: ${friendDisplayName}`);
    const friend = friends.find((f) => f.username === friendUsername);
    if (friend) {
      setActiveChatUser(friend);
    }
  };

  // Add friend handler
  const handleAddFriendSubmit = async (targetLogin: string) => {
    if (!targetLogin.trim()) return;
    setAddStatusMessage(null);
    const res = await sendFriendRequestServer(targetLogin.trim());
    if (res.success) {
      setAddStatusMessage({ text: res.message || 'Запрос успешно отправлен!' });
      setAddSearchQuery('');
    } else {
      setAddStatusMessage({ text: res.error || 'Ошибка отправки запроса', error: true });
    }
  };

  // Status selector options
  const STATUS_OPTIONS: { status: UserStatus; label: string; color: string; desc: string }[] = [
    { status: 'online', label: 'В сети', color: 'bg-emerald-500', desc: 'Виден всем друзьям' },
    { status: 'idle', label: 'Неактивен', color: 'bg-amber-500', desc: 'Отошел от ПК' },
    { status: 'dnd', label: 'Не беспокоить', color: 'bg-rose-500', desc: 'Уведомления отключены' },
    { status: 'offline', label: 'Невидимый', color: 'bg-slate-500', desc: 'Выглядит как оффлайн' }
  ];

  const handleSaveCustomStatus = () => {
    setCustomStatus(customStatusInput.trim());
    setIsEditingCustomStatus(false);
  };

  const onlineFriends = friends.filter((f) => f.status !== 'offline');

  useEffect(() => {
    if (activeChatUser) {
        const threadId = ['dm', currentUser.username, activeChatUser.username].sort().join('-');
        markAsRead(threadId);
    }
  }, [activeChatUser, markAsRead, currentUser.username]);

  if (activeChatUser) {
    const threadId = ['dm', currentUser.username, activeChatUser.username].sort().join('-');
    const threadMessages = messagesByChannel[threadId] || [];

    const handleSendDm = () => {
      if (!chatInput.trim() && dmAttachments.length === 0) return;
      sendMessage(threadId, currentUser, chatInput.trim(), dmAttachments);
      setChatInput('');
      setDmAttachments([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSendDm();
      }
    };

    const toggleReactionDm = (msgId: string, emoji: string) => {
      toggleReaction(threadId, msgId, emoji, currentUser.id);
    };

    const addPresetMessage = (preset: string) => {
      sendMessage(threadId, currentUser, preset, []);
    };

    const handleDmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          let fileType = 'file';
          if (file.type.startsWith('image/')) {
            fileType = 'image';
          } else if (file.type.startsWith('audio/')) {
            fileType = 'audio';
          } else if (file.type.startsWith('video/')) {
            fileType = 'video';
          }

          setDmAttachments([
            {
              id: `att-${Date.now()}`,
              type: fileType,
              name: file.name,
              url: event.target.result as string
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    const triggerDmFileInput = () => {
      dmFileInputRef.current?.click();
    };

    const PRESETS = [
      'Привет! ⚡',
      'Как дела? Го в катку? 🎮',
      'Залетай в голосовой звонок! 🎙️',
      'Я готов сыграть в Pulse Arena! 🏆'
    ];

    const REACTION_EMOJIS = ['🔥', '🎯', '👑', '⚡', '💯', '🎮', '🚀', '🧠'];

    return (
      <div className="flex-1 bg-transparent relative flex flex-col h-full overflow-hidden select-none">
        <AnimatedBackground />
        {/* Chat Header */}
        <div className="h-16 px-6 bg-[#111113]/80 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between flex-shrink-0 z-10 relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveChatUser(null)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-[#F5F5F7] transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold border border-white/[0.04]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад к друзьям</span>
            </button>

            <div className="w-[1px] h-6 bg-white/[0.08]" />

            <div className="flex items-center gap-3">
              <Avatar
                src={activeChatUser.avatar}
                alt={activeChatUser.displayName}
                status={friends.find(f => f.id === activeChatUser.id)?.status || activeChatUser.status}
                size="md"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-[#F5F5F7]">{activeChatUser.displayName}</h2>
                  <span className="text-[10px] font-mono text-[#22D3EE]">@{activeChatUser.username}</span>
                </div>
                <p className="text-[11px] text-[#A1A1AA]">
                  {activeChatUser.customStatus || '⚡ В сети в Pulse'}
                </p>
              </div>
            </div>
          </div>

          {activeVoiceChannelId ? (
            <button
              onClick={disconnectVoice}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:scale-[1.02]"
              title="Завершить текущий голосовой звонок"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Завершить</span>
            </button>
          ) : (
            <button
              onClick={() => handleStartCall(activeChatUser.username, activeChatUser.displayName)}
              className="px-4 py-2 rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:scale-[1.02]"
              title="Позвонить другу напрямую по WebRTC"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Позвонить</span>
            </button>
          )}
        </div>

        {/* Message Stream with floating Active Call Panel */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-[#09090B]">

          {/* Active Call Grid (Discord call stage style) */}
          {activeVoiceChannelId && (
            <div className="bg-[#111113]/90 border-b border-white/[0.06] p-4 shrink-0 flex flex-col gap-3 transition-all duration-300 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-sans">
                    Голосовой звонок • Активное подключение
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400">
                    P2P LIVE
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCallStageCollapsed(!isCallStageCollapsed)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-bold text-[#22D3EE] border border-white/[0.06] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {isCallStageCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    <span>{isCallStageCollapsed ? 'Развернуть' : 'Свернуть'}</span>
                  </button>
                </div>
              </div>
              
              <div className={`transition-all duration-300 ease-in-out overflow-visible ${
                isCallStageCollapsed ? 'max-h-0 opacity-0 pt-0' : 'max-h-[500px] opacity-100 pt-2 pb-1'
              }`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {participants.map((p) => (
                    <div
                      key={p.user.id}
                      className={`relative p-3 rounded-xl bg-white/[0.02] border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                        p.isSpeaking
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.02]'
                          : 'border-white/[0.04] hover:border-white/[0.08]'
                      }`}
                    >
                      {/* Avatar container with speaking glow ring */}
                      <div className="relative">
                        <div className={`p-0.5 rounded-full transition-all duration-300 ${
                          p.isSpeaking
                            ? 'ring-2 ring-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'ring-0'
                        }`}>
                          <img
                            src={p.user.avatar}
                            alt={p.user.displayName}
                            className="w-12 h-12 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        {/* Mic state overlay */}
                        {p.isMuted && (
                          <div className="absolute -bottom-1 -right-1 bg-rose-600 border border-[#111113] p-1 rounded-full text-white shadow-md">
                            <MicOff className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      
                      {/* Display name */}
                      <div className="text-center min-w-0 w-full">
                        <div className="text-[11px] font-bold text-white truncate">{p.user.displayName}</div>
                        {p.isSpeaking ? (
                          <div className="text-[8px] text-emerald-400 font-extrabold tracking-wider animate-pulse uppercase">говорит</div>
                        ) : (
                          <div className="text-[8px] text-[#A1A1AA] truncate">@{p.user.username}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-4 no-scrollbar">
            {threadMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto my-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#22D3EE]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F7]">Начало секретного чата с {activeChatUser.displayName}</h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mt-1">
                    Все сообщения отправляются в реальном времени с поддержкой WebRTC, реакций, вложений и уведомлений.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {threadMessages.map((msg) => {
                  const isMe = msg.author.id === currentUser.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="flex items-start gap-3 group max-w-2xl ml-auto flex-row-reverse"
                    >
                      <Avatar 
                        src={msg.author.avatar} 
                        alt={msg.author.displayName} 
                        size="md" 
                        status={isMe ? currentUser.status : (friends.find(f => f.id === msg.author.id)?.status || msg.author.status)} 
                      />
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <span className="text-xs font-bold text-[#F5F5F7]">{msg.author.displayName}</span>
                          <span className="text-[10px] text-[#A1A1AA]">{msg.timestamp}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl border text-xs leading-relaxed bg-[#22D3EE]/10 border-[#22D3EE]/30 text-[#F5F5F7] rounded-tr-none">
                          {msg.content}

                           {/* Attachments rendering */}
                           {msg.attachments && msg.attachments.length > 0 && (
                             <div className="mt-2 space-y-2">
                               {msg.attachments.map((att: any) => (
                                 <div key={att.id} className="max-w-sm overflow-hidden">
                                   {att.type === 'image' && (
                                     <div className="rounded-xl overflow-hidden border border-white/10 relative group/att bg-[#111113]">
                                       <img
                                         src={att.url}
                                         alt={att.name || 'image'}
                                         className="w-full object-cover max-h-64 cursor-pointer hover:opacity-95 transition-opacity"
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
                                     <div className="rounded-xl overflow-hidden border border-white/10 relative group/att bg-[#111113] p-1">
                                       <video
                                         src={att.url}
                                         controls
                                         className="rounded-lg overflow-hidden w-full max-h-64"
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
                                     <div className="p-2.5 rounded-xl bg-[#111113] border border-white/10 space-y-2">
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
                                     <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all max-w-sm text-left group">
                                       <div className="p-2 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] group-hover:bg-[#22D3EE]/20 transition-colors">
                                         <FileCode className="w-5 h-5" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <p className="text-xs font-bold text-[#F5F5F7] truncate">{att.name}</p>
                                         <p className="text-[10px] text-[#A1A1AA]">Файл</p>
                                       </div>
                                       <a
                                         href={att.url}
                                         download={att.name}
                                         target="_blank"
                                         rel="noreferrer"
                                         className="px-3 py-1.5 rounded-lg bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 text-[#22D3EE] text-xs font-bold flex items-center gap-1.5 transition-all border border-[#22D3EE]/30 cursor-pointer"
                                         title="Скачать файл"
                                       >
                                         <Download className="w-3.5 h-3.5" />
                                         <span>Скачать</span>
                                       </a>
                                     </div>
                                   )}
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>

                        {/* Reactions Drawer */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 justify-end">
                          {/* Current message reactions */}
                          {msg.reactions && msg.reactions.map((r) => {
                            const hasMyReaction = r.users.includes(currentUser.id);
                            return (
                              <button
                                key={r.emoji}
                                onClick={() => toggleReactionDm(msg.id, r.emoji)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                                  hasMyReaction
                                    ? 'bg-[#22D3EE]/20 border-[#22D3EE]/40 text-[#22D3EE]'
                                    : 'bg-white/5 border-white/[0.06] text-[#A1A1AA] hover:text-[#F5F5F7]'
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                              </button>
                            );
                          })}

                          {/* Quick reaction action keys (visible on hover) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-[#111113] border border-white/[0.06] p-0.5 rounded-lg">
                            {REACTION_EMOJIS.slice(0, 5).map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReactionDm(msg.id, emoji)}
                                className="p-1 rounded text-xs hover:bg-white/5 cursor-pointer"
                                title={`Добавить ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

        </div>

        {/* Input Controls */}
        <div className={`p-4 bg-[#111113] border-t border-white/[0.06] space-y-3 flex-shrink-0 transition-all ${activeVoiceChannelId ? 'pl-64 sm:pl-72' : ''}`}>
          {/* Attachments preview */}
          {dmAttachments.length > 0 && (
            <div className="flex items-center gap-2">
              {dmAttachments.map((att) => (
                <div key={att.id} className="relative rounded-xl overflow-hidden border border-white/10 w-24 h-16 bg-white/5 flex flex-col justify-center items-center p-1 text-center">
                  {att.type === 'image' ? (
                    <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <FileCode className="w-5 h-5 text-[#22D3EE] mb-0.5" />
                      <span className="text-[8px] text-slate-300 truncate w-20 px-1 font-mono">{att.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setDmAttachments([])}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#17171C] border border-white/[0.06] focus-within:border-[#22D3EE] rounded-2xl pl-3 pr-2 py-1.5 transition-all">
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
              placeholder={`Напишите личное сообщение @${activeChatUser.username}...`}
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
        </div>

        {/* Lightbox */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 animate-in fade-in duration-200"
            onClick={() => setLightboxImage(null)}
          >
            <button 
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-rose-500 transition-colors"
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
  }

  return (
    <div className="flex-1 bg-transparent relative flex flex-col select-none overflow-y-auto p-4 sm:p-8 h-full">
      <AnimatedBackground />
      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-6">
        {/* User Status & Profile Header Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#17171C] via-[#111113] to-[#17171C] border border-white/[0.08] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: User Info & Status Selector */}
            <div className="flex items-center gap-4">
              <Avatar
                src={currentUser.avatar}
                alt={currentUser.displayName}
                status={currentUser.status}
                size="xl"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[#F5F5F7]">{currentUser.displayName}</h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30">
                    @{currentUser.username}
                  </span>
                </div>

                {/* Custom Status Display & Edit */}
                {isEditingCustomStatus ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customStatusInput}
                      onChange={(e) => setCustomStatusInput(e.target.value)}
                      placeholder="Установите свой статус (например: В игре)..."
                      className="bg-[#111113] border border-[#22D3EE] rounded-xl px-3 py-1 text-xs text-[#F5F5F7] focus:outline-none w-64"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomStatus()}
                    />
                    <button
                      onClick={handleSaveCustomStatus}
                      className="px-2.5 py-1 rounded-xl bg-[#22D3EE] text-[#09090B] font-bold text-xs hover:bg-[#06b6d4] transition-all cursor-pointer"
                    >
                      ОК
                    </button>
                    <button
                      onClick={() => setIsEditingCustomStatus(false)}
                      className="p-1 rounded-xl text-[#A1A1AA] hover:text-[#F5F5F7] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                      <Smile className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>{currentUser.customStatus || '⚡ В сети в Pulse'}</span>
                    </p>
                    <button
                      onClick={() => {
                        setCustomStatusInput(currentUser.customStatus || '');
                        setIsEditingCustomStatus(true);
                      }}
                      className="text-[#A1A1AA] hover:text-[#22D3EE] transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                      title="Изменить текст статуса"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quick Status Switcher Dropdown / Buttons */}
            <div className="bg-[#111113] p-2 rounded-2xl border border-white/[0.08] flex items-center gap-1">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = currentUser.status === opt.status;
                return (
                  <button
                    key={opt.status}
                    onClick={() => setStatus(opt.status)}
                    className={`
                      px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer
                      ${
                        isActive
                          ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40 shadow-sm'
                          : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5'
                      }
                    `}
                    title={opt.desc}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error Banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* FRIENDS HUB NAVIGATION TABS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2 bg-[#111113] p-1.5 rounded-2xl border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('online')}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer
                ${
                  activeTab === 'online'
                    ? 'bg-[#22D3EE] text-[#09090B] shadow-md font-bold'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5'
                }
              `}
            >
              <Users className="w-3.5 h-3.5" />
              <span>В сети</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                {onlineFriends.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer
                ${
                  activeTab === 'all'
                    ? 'bg-[#22D3EE] text-[#09090B] shadow-md font-bold'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5'
                }
              `}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Все друзья</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                {friends.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative
                ${
                  activeTab === 'pending'
                    ? 'bg-[#22D3EE] text-[#09090B] shadow-md font-bold'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5'
                }
              `}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Запросы</span>
              {incomingRequests.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('add');
                searchUsersServer('');
              }}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer
                ${
                  activeTab === 'add'
                    ? 'bg-emerald-500 text-[#09090B] shadow-md font-bold'
                    : 'text-emerald-400 hover:bg-emerald-500/10'
                }
              `}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Добавить в друзья</span>
            </button>
          </div>
        </div>

        {/* TAB 1 & 2: ONLINE / ALL FRIENDS LIST */}
        {(activeTab === 'online' || activeTab === 'all') && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
              {activeTab === 'online' ? `Друзья в сети — ${onlineFriends.length}` : `Все друзья — ${friends.length}`}
            </div>

            {(activeTab === 'online' ? onlineFriends : friends).length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#17171C] border border-white/[0.08] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-[#A1A1AA]">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#F5F5F7]">Список друзей пуст</h3>
                <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                  Перейдите во вкладку «Добавить в друзья», чтобы найти пользователей Pulse по логину и отправить им запрос!
                </p>
                <button
                  onClick={() => {
                    setActiveTab('add');
                    searchUsersServer('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#22D3EE] text-[#09090B] font-bold text-xs uppercase tracking-wider hover:bg-[#06b6d4] transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Найти друзей</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {(activeTab === 'online' ? onlineFriends : friends).map((friend) => (
                  <div
                    key={friend.id}
                    className="p-4 rounded-2xl bg-[#17171C] border border-white/[0.08] hover:border-white/[0.15] transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar
                        src={friend.avatar}
                        alt={friend.displayName}
                        status={friend.status}
                        size="md"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#F5F5F7] truncate">
                            {friend.displayName}
                          </span>
                          <span className="text-[10px] text-[#A1A1AA] font-mono">
                            @{friend.username}
                          </span>
                        </div>
                        <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
                          {friend.customStatus || '⚡ В сети в Pulse'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveChatUser(friend)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-[#22D3EE]/15 text-[#A1A1AA] hover:text-[#22D3EE] border border-white/[0.06] hover:border-[#22D3EE]/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Написать личное сообщение"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Написать</span>
                      </button>

                      <button
                        onClick={() => handleStartCall(friend.username, friend.displayName)}
                        className="p-2.5 rounded-xl bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Позвонить напрямую через WebRTC"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span className="hidden sm:inline">Позвонить</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Удалить @${friend.username} из друзей?`)) {
                            await removeFriendServer(friend.username);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 transition-all cursor-pointer"
                        title="Удалить из друзей"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Заблокировать @${friend.username}?`)) {
                            await blockUserServer(friend.username);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-600/30 text-[#A1A1AA] hover:text-rose-600 border border-white/[0.06] hover:border-rose-600/30 transition-all cursor-pointer"
                        title="Заблокировать пользователя"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Incoming requests */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider flex items-center gap-2">
                <span>Входящие запросы</span>
                <span className="px-2 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] font-mono text-[10px]">
                  {incomingRequests.length}
                </span>
              </div>

              {incomingRequests.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#17171C] border border-white/[0.06] text-xs text-[#A1A1AA] text-center">
                  Нет новых входящих запросов в друзья.
                </div>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map((reqUser) => (
                    <div
                      key={reqUser.id}
                      className="p-4 rounded-2xl bg-[#17171C] border border-[#22D3EE]/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={reqUser.avatar}
                          alt={reqUser.displayName}
                          status={reqUser.status}
                          size="md"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold text-[#F5F5F7] truncate">
                            {reqUser.displayName}
                          </div>
                          <div className="text-[10px] text-[#22D3EE] font-mono">
                            @{reqUser.username}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => acceptFriendRequestServer(reqUser.username)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#09090B] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Принять</span>
                        </button>
                        <button
                          onClick={() => declineFriendRequestServer(reqUser.username)}
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Отклонить</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing requests */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2">
                <span>Исходящие запросы</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#A1A1AA] font-mono text-[10px]">
                  {outgoingRequests.length}
                </span>
              </div>

              {outgoingRequests.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#17171C] border border-white/[0.06] text-xs text-[#A1A1AA] text-center">
                  У вас нет ожидающих исходящих запросов.
                </div>
              ) : (
                <div className="space-y-2">
                  {outgoingRequests.map((outUser) => (
                    <div
                      key={outUser.id}
                      className="p-4 rounded-2xl bg-[#17171C] border border-white/[0.06] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={outUser.avatar}
                          alt={outUser.displayName}
                          status={outUser.status}
                          size="md"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold text-[#F5F5F7] truncate">
                            {outUser.displayName}
                          </div>
                          <div className="text-[10px] text-[#A1A1AA] font-mono">
                            @{outUser.username}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => declineFriendRequestServer(outUser.username)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Отменить</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ADD FRIEND */}
        {activeTab === 'add' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#17171C] border border-white/[0.08] space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F7]">Добавить друга в Pulse</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Введите логин пользователя (например, <span className="text-[#22D3EE] font-mono">@phantom</span>) для отправки запроса в друзья.
                </p>
              </div>

              {addStatusMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
                    addStatusMessage.error
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {addStatusMessage.error ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  <span>{addStatusMessage.text}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-[#A1A1AA] absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={addSearchQuery}
                    onChange={(e) => {
                      setAddSearchQuery(e.target.value);
                      searchUsersServer(e.target.value);
                    }}
                    placeholder="Введите логин или имя пользователя..."
                    className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl pl-11 pr-4 py-3 text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/40 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => handleAddFriendSubmit(addSearchQuery)}
                  disabled={!addSearchQuery.trim()}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#09090B] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Отправить запрос</span>
                </button>
              </div>
            </div>

            {/* Live Search & Recommended Users Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
                Пользователи в сети ({searchResults.length})
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#17171C] border border-white/[0.06] text-xs text-[#A1A1AA]">
                  Пользователи не найдены. Создайте еще один аккаунт через регистрацию для тестирования!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-2xl bg-[#17171C] border border-white/[0.08] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={user.avatar}
                          alt={user.displayName}
                          status={user.status}
                          size="md"
                        />
                        <div className="truncate">
                          <div className="text-xs font-bold text-[#F5F5F7] truncate">
                            {user.displayName}
                          </div>
                          <div className="text-[10px] text-[#22D3EE] font-mono">
                            @{user.username}
                          </div>
                        </div>
                      </div>

                      {user.relationship === 'friend' ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                          В друзьях ✓
                        </span>
                      ) : user.relationship === 'pending_outgoing' ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          Запрос отправлен
                        </span>
                      ) : user.relationship === 'pending_incoming' ? (
                        <button
                          onClick={() => acceptFriendRequestServer(user.username)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#09090B] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Принять</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddFriendSubmit(user.username)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#09090B] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Добавить</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
