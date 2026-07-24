import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Compass,
  MonitorPlay,
  Settings,
  Zap,
  Volume2,
  LogOut,
  Bell,
  Circle,
  Moon,
  MinusCircle,
  Edit2,
  EyeOff
} from 'lucide-react';
import { useCommunityStore } from '../../entities/community/communityStore';
import { useUserStore } from '../../entities/user/userStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { useGameStore } from '../../entities/game/gameStore';
import { useChatStore } from '../../entities/chat/chatStore';
import { Avatar } from '../../shared/ui/Avatar';

export const AppSidebar: React.FC = () => {
  const { communities, activeCommunityId, activeTab, setActiveCommunity, setActiveTab } =
    useCommunityStore();
  const { currentUser, friends, logout, setNotificationsModalOpen, setProfileModalOpen, incomingRequests, setStatus, isStreamerModeActive, toggleStreamerMode } = useUserStore();
  const { activeVoiceChannelId, activeVoiceChannelName } = useVoiceStore();
  const { isOverlayOpen, toggleOverlay, setSettingsOpen } = useGameStore();
  const { unreadCounts, setActiveChatUser } = useChatStore();

  // Find unread DMs
  const unreadDms = Object.entries(unreadCounts)
    .filter(([channelId]) => channelId.startsWith('dm-'))
    .map(([channelId, count]) => {
      // Find the friend this channel belongs to
      const friend = friends.find(f => {
        const expectedId = ['dm', currentUser.username, f.username].sort().join('-');
        return expectedId === channelId;
      });
      return { channelId, count, user: friend };
    })
    .filter(item => item.user !== undefined);

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className="w-16 bg-[#111113] border-r border-white/[0.06] flex flex-col items-center py-3 select-none z-[50] flex-shrink-0">
      {/* Pulse Brand Logo */}
      <div
        onClick={() => setActiveCommunity(null)}
        className="relative group cursor-pointer mb-3"
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
          activeTab === 'home'
            ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105 font-bold'
            : 'bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] hover:scale-105 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
        }`}>
          <Zap className={`w-5 h-5 ${activeTab === 'home' ? 'fill-[#09090B]' : 'fill-[#22D3EE]'}`} />
        </div>
        <span className="absolute left-16 top-2 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-2.5 py-1 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
          Pulse Главная
        </span>
        {activeTab === 'home' && (
          <motion.span
            layoutId="activePillLogo"
            className="absolute -left-2 top-2.5 w-1.5 h-5 bg-[#22D3EE] rounded-r-full"
          />
        )}
      </div>

      <div className="w-6 h-[1px] bg-white/[0.06] my-1" />

      {/* Primary Navigation Rail */}
      <div className="flex-1 flex flex-col items-center gap-2 w-full px-2 overflow-y-auto no-scrollbar py-2">
        {/* Direct Messages Button */}
        <button
          onClick={() => {
            setActiveCommunity(null);
            setActiveTab('direct_messages');
          }}
          className={`
            relative group w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer
            ${
              activeCommunityId === null && activeTab === 'direct_messages'
                ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold'
                : 'bg-[#17171C] text-[#A1A1AA] hover:bg-white/[0.08] hover:text-[#F5F5F7]'
            }
          `}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="absolute left-16 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-2.5 py-1 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
            Звонки и Друзья
          </span>
          {activeCommunityId === null && activeTab === 'direct_messages' && (
            <motion.span
              layoutId="activePill"
              className="absolute -left-2 w-1.5 h-6 bg-[#22D3EE] rounded-r-full"
            />
          )}
        </button>

        {/* Dynamic Unread DM Avatars */}
        <AnimatePresence>
          {unreadDms.map((dm) => (
            <motion.div
              key={dm.channelId}
              initial={{ opacity: 0, x: -20, scale: 0.5 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.5 }}
              onClick={() => {
                setActiveChatUser(dm.user!);
                setActiveCommunity(null);
                setActiveTab('direct_messages');
              }}
              className="relative group w-10 h-10 mb-2 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-[24px] group-hover:rounded-[16px] transition-all duration-300 overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] bg-[#17171C]">
                <img 
                  src={dm.user!.avatar} 
                  alt={dm.user!.displayName} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#111113] shadow-lg z-10">
                {dm.count}
              </div>
              {/* Tooltip */}
              <div className="absolute left-16 bg-[#17171C] border border-white/[0.08] text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 flex flex-col">
                <span className="text-[#F5F5F7]">{dm.user!.displayName}</span>
                <span className="text-[#22D3EE] font-mono text-[9px]">{dm.count} новых сообщений</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="w-6 h-[1px] bg-white/[0.06] my-1" />

        {/* Communities / Gaming Spaces */}
        {communities.map((comm) => {
          const isActive = activeCommunityId === comm.id;
          return (
            <button
              key={comm.id}
              onClick={() => setActiveCommunity(comm.id)}
              className={`
                relative group w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold'
                    : 'bg-[#17171C] text-[#F5F5F7] hover:bg-white/[0.08]'
                }
              `}
            >
              <span>{comm.icon}</span>

              {/* Tooltip */}
              <div className="absolute left-16 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 flex flex-col">
                <span className="font-bold text-[#F5F5F7]">{comm.name}</span>
                <span className="text-[10px] text-[#22D3EE]">
                  {comm.onlineCount.toLocaleString()} онлайн
                </span>
              </div>

              {isActive && (
                <motion.span
                  layoutId="activePill"
                  className="absolute -left-2 w-1.5 h-6 bg-[#22D3EE] rounded-r-full"
                />
              )}
            </button>
          );
        })}

        {/* Discovery Hub Button */}
        <button
          onClick={() => setActiveTab('discovery')}
          className={`
            relative group w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer
            ${
              activeTab === 'discovery'
                ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold'
                : 'bg-[#17171C] text-[#A1A1AA] hover:bg-white/[0.08] hover:text-[#22D3EE]'
            }
          `}
        >
          <Compass className="w-4 h-4" />
          <span className="absolute left-16 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-2.5 py-1 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
            Обзор сообществ
          </span>
          {activeTab === 'discovery' && (
            <motion.span
              layoutId="activePill"
              className="absolute -left-2 w-1.5 h-6 bg-[#22D3EE] rounded-r-full"
            />
          )}
        </button>

        {/* In-Game Overlay Mode Sandbox Button */}
        <button
          onClick={toggleOverlay}
          className={`
            relative group w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer
            ${
              isOverlayOpen
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold'
                : 'bg-[#17171C] text-[#A1A1AA] hover:bg-white/[0.08] hover:text-purple-400'
            }
          `}
        >
          <MonitorPlay className="w-4 h-4" />
          <span className="absolute left-16 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 flex flex-col">
            <span className="font-bold text-[#F5F5F7]">Игровой Оверлей (Alt+U)</span>
            <span className="text-[10px] text-purple-300">HUD Режим поверх игры</span>
          </span>
        </button>
      </div>

      {/* Active Voice Channel Quick Indicator */}
      {isStreamerModeActive && (
        <div className="mb-2">
            <div 
              onClick={toggleStreamerMode}
              className="w-9 h-9 rounded-xl bg-rose-900/50 border border-rose-500/50 flex items-center justify-center text-white cursor-pointer group relative hover:bg-rose-900/70 animate-pulse"
            >
              <EyeOff className="w-4 h-4" />
              <span className="absolute left-16 bg-[#17171C] border border-rose-500/50 text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 flex flex-col">
                <span className="text-white font-bold">Режим стримера включен</span>
                <span className="text-[10px] text-white/70">Нажмите чтобы выключить</span>
              </span>
            </div>
        </div>
      )}

      {activeVoiceChannelId && (
        <div className="mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] animate-pulse cursor-pointer group relative">
            <Volume2 className="w-4 h-4" />
            <span className="absolute left-16 bg-[#17171C] border border-[#22D3EE]/30 text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 flex flex-col">
              <span className="text-[#22D3EE] font-bold">Голосовой звонок активен</span>
              <span className="text-[10px] text-[#A1A1AA]">{activeVoiceChannelName}</span>
            </span>
          </div>
        </div>
      )}

      {/* Bottom User Actions */}
      <div className="flex flex-col items-center gap-2 mt-auto pt-2 border-t border-white/[0.06] w-full px-2">
        <button
          onClick={() => setNotificationsModalOpen(true)}
          className="w-9 h-9 rounded-xl bg-[#17171C] hover:bg-white/[0.08] text-[#A1A1AA] hover:text-[#22D3EE] flex items-center justify-center transition-colors relative group cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {incomingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#22D3EE] text-[#09090B] font-black text-[9px] flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              {incomingRequests.length}
            </span>
          )}
          <span className="absolute left-16 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-2.5 py-1 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
            Уведомления и Новости
          </span>
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          className="w-9 h-9 rounded-xl bg-[#17171C] hover:bg-white/[0.08] text-[#A1A1AA] hover:text-[#F5F5F7] flex items-center justify-center transition-colors relative group cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span className="absolute left-16 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-2.5 py-1 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
            Настройки
          </span>
        </button>

        <button
          onClick={logout}
          className="w-9 h-9 rounded-xl bg-[#17171C] hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-transparent hover:border-rose-500/30 flex items-center justify-center transition-colors relative group cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="absolute left-16 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-2.5 py-1 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
            Выйти
          </span>
        </button>

        <div
          ref={statusMenuRef}
          className="relative cursor-pointer"
          onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
        >
          <div className="relative group">
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.displayName}
              status={currentUser.status}
              size="md"
            />
            {!isStatusMenuOpen && (
              <div className="absolute left-16 bottom-0 bg-[#17171C] border border-white/[0.08] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xl text-[#F5F5F7] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 flex flex-col">
                <span className="text-[#F5F5F7] font-bold">{currentUser.displayName}</span>
                <span className="text-[10px] text-[#22D3EE]">Нажмите, чтобы изменить статус</span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {isStatusMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-14 bottom-10 w-56 bg-[#111113]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-1.5 z-[9999]"
              >
                <div className="px-2 py-1.5 mb-1">
                  <span className="text-xs font-bold text-[#F5F5F7] block">{currentUser.displayName}</span>
                  <span className="text-[10px] font-mono text-[#A1A1AA]">@{currentUser.username}</span>
                </div>
                
                <div className="h-[1px] bg-white/[0.06] my-1 mx-1" />

                <button
                  onClick={() => { setStatus('online'); setIsStatusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-[#F5F5F7] text-xs font-semibold transition-colors group cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center group-hover:shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-shadow">
                    <Circle className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" />
                  </div>
                  В сети
                </button>

                <button
                  onClick={() => { setStatus('idle'); setIsStatusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-[#F5F5F7] text-xs font-semibold transition-colors group cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center group-hover:shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-shadow">
                    <Moon className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  </div>
                  Не активен
                </button>

                <button
                  onClick={() => { setStatus('dnd'); setIsStatusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-[#F5F5F7] text-xs font-semibold transition-colors group cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center group-hover:shadow-[0_0_8px_rgba(244,63,94,0.4)] transition-shadow">
                    <MinusCircle className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                  </div>
                  Не беспокоить
                </button>

                <button
                  onClick={() => { setStatus('offline'); setIsStatusMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-[#F5F5F7] text-xs font-semibold transition-colors group cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full bg-slate-500/20 border border-slate-500/50 flex items-center justify-center group-hover:shadow-[0_0_8px_rgba(100,116,139,0.4)] transition-shadow">
                    <Circle className="w-2.5 h-2.5 text-slate-500" />
                  </div>
                  Невидимка
                </button>

                <div className="h-[1px] bg-white/[0.06] my-1 mx-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStatusMenuOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-[#22D3EE]/10 text-[#22D3EE] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  Настройки профиля
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};
