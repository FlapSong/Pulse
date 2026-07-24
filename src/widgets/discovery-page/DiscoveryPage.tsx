import React, { useState } from 'react';
import { Compass, Search, Globe, Sparkles } from 'lucide-react';
import { AnimatedBackground } from '../../shared/ui/AnimatedBackground';

export const DiscoveryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex-1 bg-transparent relative p-6 sm:p-10 overflow-y-auto select-none no-scrollbar h-full flex flex-col">
      <AnimatedBackground />
      <div className="relative z-10 max-w-3xl mx-auto w-full my-auto space-y-8 text-center">
        {/* Header Badge & Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Обзор пространств Pulse</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F7]">
            Поиск сообществ и игровых пространств
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            Находите публичные игровые пространства, серверы и сообщества единомышленников.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xl mx-auto">
          <Search className="w-4 h-4 text-[#A1A1AA] absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск сообществ по названию, тегам или играм..."
            className="w-full bg-[#111113] border border-white/[0.08] focus:border-[#22D3EE] rounded-2xl pl-11 pr-4 py-3 text-xs text-[#F5F5F7] placeholder-[#A1A1AA]/40 focus:outline-none shadow-xl transition-colors"
          />
        </div>

        {/* Empty State Banner */}
        <div className="p-10 rounded-3xl bg-[#17171C] border border-white/[0.08] max-w-xl mx-auto space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#22D3EE]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 mx-auto flex items-center justify-center text-[#22D3EE]">
            <Globe className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#F5F5F7]">
              Публичных сообществ пока нет
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-sm mx-auto">
              Каталог сообществ находится в разработке. Сейчас вы можете общаться в личных сообщениях с друзьями и подключаться к прямой голосовой комнате WebRTC по коду!
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#22D3EE] font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Прямые голосовые звонки 1-в-1 активны</span>
          </div>
        </div>
      </div>
    </div>
  );
};
