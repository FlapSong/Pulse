import React, { useState } from 'react';
import {
  Hash,
  Volume2,
  ChevronDown,
  ChevronRight,
  Shield,
  Sparkles,
  Radio,
  Plus
} from 'lucide-react';
import { useCommunityStore } from '../../entities/community/communityStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { Avatar } from '../../shared/ui/Avatar';
import { AudioWaveform } from '../../shared/ui/AudioWaveform';

export const CommunitySidebar: React.FC = () => {
  const { getActiveCommunity, activeChannelId, setActiveChannel } = useCommunityStore();
  const {
    activeVoiceChannelId,
    connectToVoice,
    participants,
  } = useVoiceStore();

  const activeCommunity = getActiveCommunity();
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  if (!activeCommunity) {
    return null;
  }

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <div className="w-56 bg-[#111113] border-r border-white/[0.06] flex flex-col select-none flex-shrink-0">
      {/* Community Header */}
      <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between bg-[#111113]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl flex-shrink-0">{activeCommunity.icon}</span>
          <div className="truncate">
            <h2 className="font-bold text-[#F5F5F7] text-xs truncate flex items-center gap-1.5">
              {activeCommunity.name}
              <Shield className="w-3.5 h-3.5 text-[#22D3EE]" />
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-[#A1A1AA]">
              <span className="flex items-center gap-1 text-[#22D3EE] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                {activeCommunity.onlineCount.toLocaleString()} в сети
              </span>
            </div>
          </div>
        </div>
        <button className="text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors p-1.5 rounded-xl hover:bg-white/[0.06] cursor-pointer">
          <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
        </button>
      </div>

      {/* Channel Categories & Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 no-scrollbar">
        {activeCommunity.categories.map((category) => {
          const isCollapsed = collapsedCategories[category.id];
          const categoryChannels = activeCommunity.channels.filter((ch) =>
            category.channelIds.includes(ch.id)
          );

          return (
            <div key={category.id} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-wider text-[#A1A1AA] hover:text-[#F5F5F7] uppercase transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <span>{category.name}</span>
                </div>
                <Plus className="w-3 h-3 hover:text-[#22D3EE]" />
              </button>

              {/* Channels */}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {categoryChannels.map((channel) => {
                    const isSelected = activeChannelId === channel.id;
                    const isVoiceChannel = channel.type === 'voice';
                    const isVoiceConnected = isVoiceChannel && activeVoiceChannelId === channel.id;

                    return (
                      <div key={channel.id} className="flex flex-col">
                        <button
                          onClick={() => {
                            setActiveChannel(channel.id);
                            if (isVoiceChannel) {
                              connectToVoice(channel.id, channel.name);
                            }
                          }}
                          className={`
                            w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer
                            ${
                              isSelected || isVoiceConnected
                                ? 'bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30'
                                : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#F5F5F7]'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isVoiceChannel ? (
                              <Volume2
                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  isVoiceConnected ? 'text-[#22D3EE] animate-pulse' : 'text-[#A1A1AA]'
                                }`}
                              />
                            ) : channel.type === 'stream' ? (
                              <Radio className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                            ) : (
                              <Hash className="w-3.5 h-3.5 flex-shrink-0 text-[#A1A1AA]" />
                            )}
                            <span className="truncate">{channel.name}</span>
                          </div>

                          {isVoiceChannel && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#17171C] text-[#22D3EE] font-mono border border-white/[0.06]">
                              {isVoiceConnected ? participants.length : channel.userCount || 0}
                            </span>
                          )}
                        </button>

                        {/* Active Voice Participants */}
                        {isVoiceChannel && isVoiceConnected && (
                          <div className="ml-5 my-1 pl-2 border-l border-[#22D3EE]/30 space-y-1 py-1">
                            {participants.filter(p => p && p.user).map((p, idx) => (
                              <div
                                key={p.user.id || idx}
                                className="flex items-center justify-between text-xs py-0.5 pr-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar
                                    src={p.user.avatar}
                                    alt={p.user.displayName || 'Участник'}
                                    size="sm"
                                    isSpeaking={p.isSpeaking}
                                  />
                                  <span
                                    className={`truncate text-[11px] ${
                                      p.isSpeaking ? 'text-[#22D3EE] font-bold' : 'text-[#F5F5F7]'
                                    }`}
                                  >
                                    {p.user.displayName || 'Участник'}
                                  </span>
                                </div>
                                {p.isSpeaking && (
                                  <AudioWaveform active={true} bars={3} height={12} colorClass="bg-[#22D3EE]" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Community Bottom Booster Stats */}
      <div className="p-3 bg-[#09090B] border-t border-white/[0.06] flex items-center justify-between text-xs text-[#A1A1AA]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
          <span className="text-[10px] font-mono text-[#F5F5F7]">
            WebRTC Live Engine
          </span>
        </div>
      </div>
    </div>
  );
};
