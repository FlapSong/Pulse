import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  UserPlus,
  Sparkles,
  Check,
  Clock,
  CheckCheck,
  Megaphone,
  UserCheck,
  UserX
} from 'lucide-react';
import { useUserStore } from '../../entities/user/userStore';
import { Avatar } from '../../shared/ui/Avatar';

interface DevNewsItem {
  id: string;
  version: string;
  title: string;
  date: string;
  tag: 'Апдейт' | 'Фича' | 'Система';
  description: string;
  points: string[];
}

const DEV_NEWS: DevNewsItem[] = [
  {
    id: 'news-2.0.0',
    version: 'v2.0.0',
    title: 'Масштабный апдейт Pulse HQ v2.0.0',
    date: '23 июля 2026',
    tag: 'Апдейт',
    description: 'Глобальная оптимизация интерфейса и новые возможности для комфортной игры.',
    points: [
      '🚀 Повышена производительность всех страниц и оптимизирован процесс авторизации.',
      '✨ Добавлены плавные анимации интерфейса.',
      '🛠️ Улучшено UX: переработано расположение элементов оверлея.',
      '🐛 Исправлены критические ошибки и повышена стабильность.'
    ]
  },
  {
    id: 'news-1.0.0',
    version: 'v1.0.0',
    title: 'Официальный Релиз Pulse HQ v1.0.0',
    date: '23 июля 2026',
    tag: 'Апдейт',
    description: 'Запуск первой официальной версии игровой платформы Pulse HQ с полноценными звонками и заявками в друзья!',
    points: [
      '⚡ Быстрый вход для временных гостевых аккаунтов в 1 клик без регистрации.',
      '🔔 Центр уведомлений: входящие заявки в друзья и актуальные новости разработки.',
      '🔒 Оптимизировано подтверждение входа по e-mail и добавлена стильная галочка «Запомнить меня».'
    ]
  },
  {
    id: 'news-0.9.0',
    version: 'v0.9.0',
    title: 'Голосовые WebRTC Звонки и Игровой Оверлей',
    date: '23 июля 2026',
    tag: 'Система',
    description: 'Внедрен защищенный голосовой движок WebRTC и удобный HUD-режим.',
    points: [
      '📞 Прямые голосовые звонки 1-в-1 по коду комнаты с анимацией громкости.',
      '🎮 Компактный оверлей по сочетанию клавиш Alt+U поверх любых видеоигр.',
      '👥 Глобальный поиск игроков по никнейму и кастомизация игровых статусов.'
    ]
  }
];

export const NotificationsModal: React.FC = () => {
  const {
    notificationsModalOpen,
    setNotificationsModalOpen,
    incomingRequests,
    acceptFriendRequestServer,
    declineFriendRequestServer,
    fetchFriendsServer
  } = useUserStore();

  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'news'>('all');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (notificationsModalOpen) {
      fetchFriendsServer();
    }
  }, [notificationsModalOpen]);

  if (!notificationsModalOpen) return null;

  const handleAccept = async (login: string) => {
    setProcessingUser(login);
    const res = await acceptFriendRequestServer(login);
    setProcessingUser(null);
    if (res.success) {
      setActionSuccessMsg(`Заявка от @${login} принята!`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleDecline = async (login: string) => {
    setProcessingUser(login);
    const res = await declineFriendRequestServer(login);
    setProcessingUser(null);
    if (res.success) {
      setActionSuccessMsg(`Заявка от @${login} отклонена.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const totalNotificationsCount = incomingRequests.length + DEV_NEWS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090B]/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-[#17171C] border border-white/[0.12] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#111113]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F5F7] flex items-center gap-2">
                Уведомления
                {totalNotificationsCount > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 font-bold">
                    {incomingRequests.length} заявок
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#A1A1AA]">
                Запросы в друзья и актуальные новости разработки Pulse
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNotificationsModalOpen(false)}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-[#A1A1AA] hover:text-[#F5F5F7] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Status Alert */}
        <AnimatePresence>
          {actionSuccessMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#22D3EE]/10 border-b border-[#22D3EE]/20 px-5 py-2.5 flex items-center gap-2 text-xs font-bold text-[#22D3EE]"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Switcher */}
        <div className="px-5 py-2 bg-[#111113]/90 border-b border-white/[0.06] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.05]'
            }`}
          >
            Все ({totalNotificationsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.05]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Заявки ({incomingRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'news'
                ? 'bg-[#22D3EE] text-[#09090B] shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.05]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Новости ({DEV_NEWS.length})</span>
          </button>
        </div>

        {/* Notifications Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* SECTION 1: Friend Requests */}
          {(activeTab === 'all' || activeTab === 'requests') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#22D3EE]" />
                  Запросы в друзья ({incomingRequests.length})
                </span>
              </div>

              {incomingRequests.length === 0 ? (
                activeTab === 'requests' && (
                  <div className="py-10 text-center space-y-2">
                    <UserCheck className="w-10 h-10 text-[#A1A1AA]/30 mx-auto" />
                    <p className="text-xs text-[#A1A1AA]">Входящих заявок в друзья пока нет</p>
                    <p className="text-[11px] text-[#A1A1AA]/60">
                      Вы можете найти других участников через вкладку «Звонки и Друзья»
                    </p>
                  </div>
                )
              ) : (
                incomingRequests.map((reqUser) => (
                  <div
                    key={reqUser.id}
                    className="p-3.5 rounded-2xl bg-[#111113] border border-white/[0.08] hover:border-[#22D3EE]/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={reqUser.avatar}
                        alt={reqUser.displayName}
                        status={reqUser.status}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#F5F5F7] truncate">
                            {reqUser.displayName}
                          </h4>
                          <span className="text-[10px] text-[#22D3EE] font-mono">
                            @{reqUser.username}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A1A1AA] truncate">
                          {reqUser.customStatus || 'Хочет добавиться к вам в друзья'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={processingUser === reqUser.username}
                        onClick={() => handleAccept(reqUser.username)}
                        className="px-3 py-1.5 rounded-xl bg-[#22D3EE] text-[#09090B] font-bold text-xs hover:bg-[#06b6d4] active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Принять</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingUser === reqUser.username}
                        onClick={() => handleDecline(reqUser.username)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-transparent hover:border-rose-500/30 text-xs font-bold active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Отклонить</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SECTION 2: Real App Development News */}
          {(activeTab === 'all' || activeTab === 'news') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-[#22D3EE]" />
                  Новости разработки Pulse
                </span>
              </div>

              {DEV_NEWS.map((news) => (
                <div
                  key={news.id}
                  className="p-4 rounded-2xl bg-[#111113] border border-white/[0.08] hover:border-[#22D3EE]/30 transition-all space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#22D3EE]/20 border border-[#22D3EE]/30 text-[#22D3EE] font-mono text-[10px] font-bold">
                        {news.version}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] bg-white/[0.05] px-2 py-0.5 rounded-md">
                        {news.tag}
                      </span>
                      <h4 className="text-xs font-bold text-[#F5F5F7]">{news.title}</h4>
                    </div>
                    <span className="text-[10px] text-[#A1A1AA]/60 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {news.date}
                    </span>
                  </div>

                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    {news.description}
                  </p>

                  <div className="space-y-1 pt-1 border-t border-white/[0.04]">
                    {news.points.map((pt, i) => (
                      <p key={i} className="text-[11px] text-[#F5F5F7]/80 leading-snug">
                        {pt}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
