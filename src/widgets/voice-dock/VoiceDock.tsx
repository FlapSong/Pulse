import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Monitor,
  Sparkles,
  Radio
} from 'lucide-react';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { useCommunityStore } from '../../entities/community/communityStore';
import { useChatStore } from '../../entities/chat/chatStore';

export const VoiceDock: React.FC = () => {
  const {
    activeVoiceChannelId,
    activeVoiceChannelName,
    isMuted,
    isDeafened,
    isScreenSharing,
    isKrispActive,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
    toggleKrisp,
    disconnectVoice,
    participants
  } = useVoiceStore();

  const { activeTab } = useCommunityStore();
  const { activeChatUser } = useChatStore();

  if (!activeVoiceChannelId) return null;

  // Determine the left positioning dynamically based on active sidebars
  let positionClass = 'left-20';
  if (activeTab === 'channels') {
    // AppSidebar (64px) + CommunitySidebar (224px) = 288px. Plus some gap = 304px
    positionClass = 'left-20 md:left-[304px]';
  } else if (activeTab === 'direct_messages') {
    if (activeChatUser) {
      // AppSidebar (64px) + renderDmSidebar (256px) = 320px. Plus some gap = 336px
      positionClass = 'left-20 md:left-[336px]';
    } else {
      // Sidebar is full width on mobile, w-64 on desktop
      positionClass = 'left-1/2 -translate-x-1/2 md:left-[336px] md:translate-x-0';
    }
  }

  return (
    <div className={`fixed bottom-4 ${positionClass} z-10 w-60 bg-[#111113]/95 border border-emerald-500/30 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-3 flex flex-col gap-2.5 select-none animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      {/* Connected Channel Info */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Голос подключен</span>
            </div>
            <div className="text-[11px] font-bold text-[#F5F5F7] truncate">
              {activeVoiceChannelName}
            </div>
          </div>
        </div>
      </div>

      {/* Voice Action Controls Row */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          {/* Toggle Mute */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'bg-white/[0.04] text-[#F5F5F7] hover:bg-white/[0.08]'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          {/* Toggle Deafen */}
          <button
            onClick={toggleDeafen}
            title={isDeafened ? 'Включить звук' : 'Заглушить звук'}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDeafened
                ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                : 'bg-white/[0.04] text-[#F5F5F7] hover:bg-white/[0.08]'
            }`}
          >
            {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Toggle Screen Share */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Остановить стрим' : 'Стрим экрана'}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isScreenSharing
                ? 'bg-[#22D3EE]/20 text-[#22D3EE] hover:bg-[#22D3EE]/30'
                : 'bg-white/[0.04] text-[#A1A1AA] hover:text-[#F5F5F7]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Krisp */}
          <button
            onClick={toggleKrisp}
            title={isKrispActive ? 'Шумоподавление Вкл' : 'Шумоподавление Выкл'}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isKrispActive
                ? 'bg-[#22D3EE]/20 text-[#22D3EE] hover:bg-[#22D3EE]/30'
                : 'bg-white/[0.04] text-[#A1A1AA] hover:text-[#F5F5F7]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Disconnect Voice */}
        <button
          onClick={disconnectVoice}
          title="Отключиться"
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
