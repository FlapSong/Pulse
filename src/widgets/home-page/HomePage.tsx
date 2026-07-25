import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Users,
  Radio,
  Cpu,
  Smile,
  Shield,
  Clock,
  ArrowRight,
  MessageSquare,
  Activity,
  UserCheck,
  Gamepad2
} from 'lucide-react';
import { useUserStore } from '../../entities/user/userStore';
import { useCommunityStore } from '../../entities/community/communityStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { Avatar } from '../../shared/ui/Avatar';

import { AnimatedBackground } from '../../shared/ui/AnimatedBackground';

export const HomePage: React.FC = () => {
  const { currentUser, friends } = useUserStore();
  const { setActiveTab } = useCommunityStore();
  const { activeVoiceChannelId, activeVoiceChannelName, roomCode, participants } = useVoiceStore();

  // Simulated metrics for system health dashboard
  const [latency, setLatency] = useState(24);
  const [packetLoss, setPacketLoss] = useState(0.0);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real slightly fluctuating network metrics to demonstrate real-time response
      setLatency(prev => Math.max(12, Math.min(48, prev + Math.floor(Math.random() * 5) - 2)));
      setPacketLoss(prev => Math.max(0.0, Math.min(0.2, Number((prev + (Math.random() > 0.85 ? 0.1 : -0.1)).toFixed(2)))));
      setFps(prev => Math.max(58, Math.min(60, prev + (Math.random() > 0.9 ? -1 : 1))));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const onlineFriends = friends.filter(f => f.status !== 'offline');

  return (
    <div className="flex-1 bg-transparent relative flex flex-col select-none overflow-y-auto h-full no-scrollbar">
      <AnimatedBackground />
      <div className="relative z-10 p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Modern Welcome Banner */}
        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#17171C] via-[#111113] to-[#0D151C] border border-[#22D3EE]/20 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-72 h-72 bg-[#A855F7]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-bold tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5 fill-[#22D3EE] animate-pulse" />
                <span>Голосовая связь Pulse Активна</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7] tracking-tight">
                Добро пожаловать в Pulse, <span className="text-[#22D3EE]">{currentUser.displayName}</span>!
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-xl">
                Ваша универсальная платформа для мгновенного голосового WebRTC-общения и обмена сообщениями с друзьями.
              </p>
              <div className="pt-2 text-xs text-[#A1A1AA] font-semibold flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Высококачественная голосовая связь WebRTC с интеллектуальным шумоподавлением Krisp AI</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] p-4 rounded-2xl">
              <Avatar src={currentUser.avatar} alt={currentUser.displayName} status={currentUser.status} size="xl" />
              <div>
                <h4 className="text-sm font-bold text-[#F5F5F7]">{currentUser.displayName}</h4>
                <p className="text-[11px] text-[#A1A1AA]">@{currentUser.username}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono">
                  <Smile className="w-3 h-3" />
                  <span>{currentUser.customStatus || 'Активен'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Navigation Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('direct_messages')}
            className="p-5 rounded-2xl bg-[#111113] hover:bg-[#17171C] border border-white/[0.04] hover:border-[#22D3EE]/30 transition-all text-left group cursor-pointer flex flex-col justify-between h-36"
          >
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 flex items-center justify-center text-[#22D3EE] group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7] group-hover:text-[#22D3EE] transition-colors flex items-center gap-1.5">
                <span>Личные сообщения</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-[11px] text-[#A1A1AA] mt-1">Чат, аудио и видеозвонки с друзьями.</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('discovery')}
            className="p-5 rounded-2xl bg-[#111113] hover:bg-[#17171C] border border-white/[0.04] hover:border-[#22D3EE]/30 transition-all text-left group cursor-pointer flex flex-col justify-between h-36"
          >
            <div className="w-10 h-10 rounded-xl bg-[#34D399]/10 flex items-center justify-center text-[#34D399] group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7] group-hover:text-[#34D399] transition-colors flex items-center gap-1.5">
                <span>Поиск сообществ</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-[11px] text-[#A1A1AA] mt-1">Найдите единомышленников и игровые лобби.</p>
            </div>
          </button>
        </div>

        {/* Live Call Alert Widget */}
        {activeVoiceChannelId && (
          <div className="p-5 rounded-2xl bg-[#17171C] border border-[#22D3EE] shadow-[0_0_20px_rgba(34,211,238,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#22D3EE] block">АКТИВНОЕ ГОЛОСОВОЕ СОЕДИНЕНИЕ</span>
                <span className="text-sm font-bold text-white">{activeVoiceChannelName}</span>
                <span className="text-[10px] text-[#A1A1AA] block font-mono">Комната: {roomCode} • Участников: {participants.length}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('direct_messages')}
              className="px-4 py-2 rounded-xl bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
            >
              <span>Показать звонок</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Section: Friends Online and Trust Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Friends Online - now taking a wider column */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-[#111113] border border-white/[0.04] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Друзья в сети ({onlineFriends.length})</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">
                Активно
              </span>
            </div>

            {onlineFriends.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-center text-xs text-[#A1A1AA] space-y-1">
                <span>Никого нет в сети</span>
                <span className="text-[10px] opacity-60">Добавьте друзей во вкладке «Звонки и Друзья»</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                {onlineFriends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar src={friend.avatar} alt={friend.displayName} status={friend.status} size="md" />
                      <div>
                        <div className="text-xs font-bold text-white">{friend.displayName}</div>
                        <div className="text-[10px] text-[#A1A1AA]">{friend.customStatus || '⚡ В сети'}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('direct_messages')}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#22D3EE]/20 hover:text-[#22D3EE] text-slate-300 transition-colors cursor-pointer"
                      title="Начать чат"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick status / Info Card */}
          <div className="p-6 rounded-2xl bg-[#111113] border border-white/[0.04] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/[0.04]">
                <Shield className="w-4 h-4 text-[#22D3EE]" />
                <span>Безопасность</span>
              </h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Pulse использует пиринговую технологию WebRTC для прямой передачи голоса и сообщений без промежуточных серверов. Ваша конфиденциальность защищена сквозным шифрованием.
              </p>
            </div>
            
            <div className="pt-2">
              <div className="p-3 rounded-xl bg-[#22D3EE]/5 border border-[#22D3EE]/10 text-center">
                <span className="text-[10px] text-[#22D3EE] font-bold block uppercase">Статус Сети</span>
                <span className="text-[11px] font-mono text-[#F5F5F7] font-semibold mt-1 block">Шифрование: P2P Secure</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
