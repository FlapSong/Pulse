import React from 'react';
import {
  Zap,
  Radio,
  Copy,
  Check,
  PhoneCall,
  Volume2
} from 'lucide-react';
import { Avatar } from '../../shared/ui/Avatar';
import { useUserStore } from '../../entities/user/userStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { AudioWaveform } from '../../shared/ui/AudioWaveform';

export const MemberSidebar: React.FC = () => {
  const { currentUser, friends } = useUserStore();
  const { activeVoiceChannelName, roomCode, participants } = useVoiceStore();

  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onlineFriends = friends.filter((f) => f.status !== 'offline');

  return (
    <div className="w-60 bg-[#111113] border-l border-white/[0.06] flex flex-col select-none flex-shrink-0">
      {/* Header */}
      <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between text-xs font-semibold text-[#F5F5F7]">
        <span className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-[#22D3EE]" />
          Участники & Друзья
        </span>
        <span className="text-[11px] font-mono text-[#22D3EE] font-bold">
          {1 + onlineFriends.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
        {/* Real User Card */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-[#A1A1AA] uppercase">
            ВЫ (В СЕТИ)
          </div>

          <div className="px-2.5 py-2 rounded-2xl bg-[#17171C] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={currentUser.avatar}
                alt={currentUser.displayName}
                status={currentUser.status}
                size="md"
              />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#F5F5F7] truncate">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30">
                    YOU
                  </span>
                </div>
                <div className="text-[10px] text-[#A1A1AA] truncate">
                  @{currentUser.username}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Friends List */}
        {onlineFriends.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-[#22D3EE] uppercase flex items-center justify-between">
              <span>ДРУЗЬЯ В СЕТИ</span>
              <span className="font-mono">{onlineFriends.length}</span>
            </div>

            {onlineFriends.map((f) => (
              <div
                key={f.id}
                className="px-2.5 py-2 rounded-2xl bg-[#17171C] border border-white/[0.06] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={f.avatar}
                    alt={f.displayName}
                    status={f.status}
                    size="md"
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-[#F5F5F7] truncate">
                      {f.displayName}
                    </div>
                    <div className="text-[10px] text-[#A1A1AA] font-mono truncate">
                      @{f.username}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Real Connected Voice Peers */}
        {participants.length > 1 && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase flex items-center justify-between">
              <span>ПОДКЛЮЧЕННЫЕ ДРУЗЬЯ (WEBRTC)</span>
              <span className="font-mono">{participants.length - 1}</span>
            </div>

            {participants
              .filter((p) => p && p.user && currentUser && p.user.id !== currentUser.id)
              .map((p) => (
                <div
                  key={p.user.id}
                  className="px-2.5 py-2 rounded-2xl bg-[#17171C] border border-emerald-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={p.user.avatar}
                      alt={p.user.displayName || 'Участник'}
                      status="online"
                      size="md"
                      isSpeaking={p.isSpeaking}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#F5F5F7] truncate">
                          {p.user.displayName || 'Участник'}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          LIVE
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium truncate">
                        {p.isSpeaking ? 'Говорит в микрофон...' : 'Голосовая связь активна'}
                      </div>
                    </div>
                  </div>

                  {p.isSpeaking && (
                    <AudioWaveform active={true} bars={3} height={12} colorClass="bg-emerald-400" />
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
