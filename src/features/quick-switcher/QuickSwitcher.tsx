import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Hash,
  Volume2,
  Users,
  Settings,
  Sparkles,
  Command,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';
import { useCommunityStore } from '../../entities/community/communityStore';
import { useGameStore } from '../../entities/game/gameStore';

export const QuickSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { communities, setActiveCommunity, setActiveChannel, setActiveTab } = useCommunityStore();
  const { setSettingsOpen } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const allChannels = communities.flatMap((c) =>
    c.channels.map((ch) => ({ ...ch, communityName: c.name, communityId: c.id }))
  );

  const filteredChannels = allChannels.filter((ch) =>
    ch.name.toLowerCase().includes(query.toLowerCase()) ||
    ch.communityName.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectChannel = (communityId: string, channelId: string) => {
    setActiveCommunity(communityId);
    setActiveChannel(channelId);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-24 px-4 select-none">
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Input Header */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a channel name, space, or command..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-1 rounded border border-slate-700">
              ESC
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 no-scrollbar">
            {/* Quick Actions */}
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              QUICK ACTIONS
            </div>

            <button
              onClick={() => {
                setSettingsOpen(true);
                setIsOpen(false);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 text-left flex items-center justify-between text-xs text-slate-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Open Platform Settings</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-2">
              CHANNELS & SPACES ({filteredChannels.length})
            </div>

            {filteredChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChannel(ch.communityId, ch.id)}
                className="w-full p-2.5 rounded-xl hover:bg-indigo-600/20 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {ch.type === 'voice' ? (
                    <Volume2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-white truncate">{ch.name}</span>
                  <span className="text-[10px] text-slate-500 truncate">
                    in {ch.communityName}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </button>
            ))}
          </div>

          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Use ↑ ↓ keys to navigate, Enter to select</span>
            <span className="text-indigo-400 font-mono font-medium">Pulse Switcher</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
