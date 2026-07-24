import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Gamepad2,
  Activity,
  Radio,
  Sparkles,
  Zap,
  Layers,
  Crosshair,
  Sliders,
  Tv,
  Eye,
  Flame,
  Search,
  RefreshCw,
  ShieldCheck,
  Mic,
  MicOff
} from 'lucide-react';
import { useGameStore } from '../../entities/game/gameStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { Avatar } from '../../shared/ui/Avatar';
import { AudioWaveform } from '../../shared/ui/AudioWaveform';

export const OverlayHUD: React.FC = () => {
  const {
    isOverlayOpen,
    setOverlayOpen,
    toggleOverlay,
    performanceMetrics,
    activeGameName,
    setActiveGameName,
    isOverlayEnabled
  } = useGameStore();

  const { participants, isMuted, toggleMute, activeVoiceChannelName } = useVoiceStore();

  // Simulated automatic window/process scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProcess, setScannedProcess] = useState({
    pid: 14092,
    executable: 'VALORANT-Win64-Shipping.exe',
    ramUsage: '4.2 ГБ',
    cpuUsage: '14%'
  });

  const GAMES_LIST = [
    { name: 'Valorant', genre: 'Тактический шутер', icon: Gamepad2, exe: 'VALORANT-Win64-Shipping.exe', pid: 14092 },
    { name: 'Counter-Strike 2', genre: 'Соревновательный шутер', icon: Zap, exe: 'cs2.exe', pid: 8214 },
    { name: 'League of Legends', genre: 'MOBA Арена', icon: Layers, exe: 'League of Legends.exe', pid: 19442 },
    { name: 'Pulse Arena', genre: 'Встроенная мини-игра', icon: Sparkles, exe: 'pulse_arena.exe', pid: 4952 },
    { name: 'Cyberpunk 2077', genre: 'Экшен RPG', icon: Tv, exe: 'Cyberpunk2077.exe', pid: 11024 },
    { name: 'Apex Legends', genre: 'Королевская битва', icon: Flame, exe: 'r5apex.exe', pid: 15302 }
  ];

  // Global Keyboard Event Listener for Alt + U (and Alt + г on Russian layout) and ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check Alt+U or Alt+г
      if (e.altKey && (e.key.toLowerCase() === 'u' || e.key.toLowerCase() === 'г')) {
        e.preventDefault();
        if (isOverlayEnabled) {
          toggleOverlay();
        }
      }
      // ESC closes when open
      if (e.key === 'Escape' && isOverlayOpen) {
        e.preventDefault();
        setOverlayOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverlayOpen, toggleOverlay, setOverlayOpen, isOverlayEnabled]);

  // Run automatic scanner whenever overlay is opened
  useEffect(() => {
    if (isOverlayOpen && isOverlayEnabled) {
      setIsScanning(true);
      fetch('/api/system/process')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.process) {
            setScannedProcess(data.process);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsScanning(false);
        });
    }
  }, [isOverlayOpen, isOverlayEnabled]);

  // Rescan function to inspect running PC processes
  const handleRescan = () => {
    setIsScanning(true);
    fetch('/api/system/process')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.process) {
          setScannedProcess(data.process);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsScanning(false);
      });
  };

  if (!isOverlayOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B]/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      <AnimatePresence mode="wait">
        {!isOverlayEnabled ? (
          <motion.div
            key="disabled"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-[#111113] border border-white/[0.08] rounded-3xl shadow-2xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Оверлей отключен</h2>
            <p className="text-sm text-slate-400 mb-6">
              Игровой оверлей был отключен в настройках. Включите его, чтобы снова использовать HUD.
            </p>
            <button
              onClick={() => setOverlayOpen(false)}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all"
            >
              Закрыть
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="enabled"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-4xl bg-[#111113] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Top Overlay Banner */}
            <div className="h-16 px-6 border-b border-white/[0.06] bg-[#17171C] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                  <Gamepad2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#F5F5F7] tracking-tight">Pulse Game HUD Overlay</span>
                    <span className="text-[10px] bg-purple-500/15 text-purple-300 font-bold px-2 py-0.5 rounded-lg border border-purple-500/20">
                      HUD АКТИВЕН
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A1A1AA]">
                    Активный процесс: <strong className="text-[#22D3EE]">{scannedProcess.executable}</strong> • Хоткей: <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[9px] border border-white/10 text-[#F5F5F7]">Alt + U</kbd>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setOverlayOpen(false)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#A1A1AA] hover:text-[#F5F5F7] border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer"
                title="Закрыть оверлей"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Overlay Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] no-scrollbar">
              
              {/* Main 3-Column Tech Widgets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Widget 1: Real-time Telemetry */}
                <div className="bg-[#17171C] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between min-h-[280px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <span className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-400" /> Телеметрия HUD
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono">
                        LIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#09090B] p-3 rounded-xl border border-white/[0.04]">
                        <div className="text-[9px] text-[#A1A1AA] font-bold tracking-wider uppercase">Кадры в сек</div>
                        <div className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
                          {performanceMetrics.fps}
                        </div>
                      </div>
                      <div className="bg-[#09090B] p-3 rounded-xl border border-white/[0.04]">
                        <div className="text-[9px] text-[#A1A1AA] font-bold tracking-wider uppercase">Время кадра</div>
                        <div className="text-xl font-extrabold font-mono text-[#F5F5F7] mt-1">
                          {performanceMetrics.frameTimeMs}мс
                        </div>
                      </div>
                      <div className="bg-[#09090B] p-3 rounded-xl border border-white/[0.04]">
                        <div className="text-[9px] text-[#A1A1AA] font-bold tracking-wider uppercase">Сеть Ping</div>
                        <div className="text-xl font-extrabold font-mono text-[#22D3EE] mt-1">
                          {performanceMetrics.pingMs}мс
                        </div>
                      </div>
                      <div className="bg-[#09090B] p-3 rounded-xl border border-white/[0.04]">
                        <div className="text-[9px] text-[#A1A1AA] font-bold tracking-wider uppercase">Память (ОЗУ)</div>
                        <div className="text-xl font-extrabold font-mono text-purple-400 mt-1">
                          {performanceMetrics.ramUsageGb} ГБ
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-[#09090B] p-3 rounded-xl border border-white/[0.04] text-[10px] text-[#A1A1AA] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="leading-relaxed">
                      Оверлей считывает реальную скорость отрисовки кадров вашего дисплея и время отклика сети.
                    </span>
                  </div>
                </div>

                {/* Widget 2: Auto-Sensing Game Detector */}
                <div className="bg-[#17171C] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between min-h-[280px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-1">
                      <span className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-purple-400" /> Детектор запущенной игры
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono ${
                        isScanning ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      }`}>
                        {isScanning ? 'СКАН...' : 'СЧИТАНО'}
                      </span>
                    </div>

                    {isScanning ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                        <div className="text-center">
                          <p className="text-xs font-bold text-[#F5F5F7]">Сканирование памяти ОС...</p>
                          <p className="text-[9px] text-[#A1A1AA]">Поиск активных игровых хэндлов</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Detected Process Card */}
                        <div className="p-3.5 rounded-xl bg-purple-600/10 border border-purple-500/30 flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                            <Gamepad2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-white leading-none">{activeGameName}</p>
                              <span className="text-[9px] bg-emerald-400/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded font-mono">ACTIVE</span>
                            </div>
                            <p className="text-[10px] text-purple-200 mt-1 font-mono truncate">{scannedProcess.executable}</p>
                            
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2.5 pt-2 border-t border-purple-500/20 text-[9px] font-mono text-[#A1A1AA]">
                              <div>PID: <span className="text-[#F5F5F7]">{scannedProcess.pid}</span></div>
                              <div>ЦП: <span className="text-[#F5F5F7]">{scannedProcess.cpuUsage}</span></div>
                              <div className="col-span-2">Память процесса: <span className="text-[#F5F5F7]">{scannedProcess.ramUsage}</span></div>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 leading-relaxed bg-[#09090B] p-2.5 rounded-xl border border-white/[0.04]">
                          <span className="text-[#22D3EE] font-bold">Как это работает:</span> Оверлей подключается к API операционной системы и считывает дескрипторы активных окон пользователя в реальном времени.
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleRescan}
                    disabled={isScanning}
                    className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border bg-white/5 hover:bg-white/10 text-[#F5F5F7] border-white/[0.06] active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Считывание...' : 'Пересканировать процессы'}</span>
                  </button>
                </div>

                {/* Widget 3: Live Visual Mod Settings (DISABLED / IN DEVELOPMENT) */}
                <div className="bg-[#17171C] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between min-h-[280px] opacity-60">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-slate-500" /> Визуальные моды
                      </span>
                      <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                        В РАЗРАБОТКЕ
                      </span>
                    </div>

                    <div className="space-y-3 pointer-events-none select-none">
                      {/* Toggle Option 1: Crosshair */}
                      <div className="p-3 bg-[#09090B]/50 border border-white/[0.02] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-white/5 text-slate-500">
                            <Crosshair className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400">Прицел поверх игр</p>
                            <p className="text-[9px] text-slate-500">Зеленый маркер в центре</p>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 px-2 py-1 rounded bg-white/5 border border-white/5">
                          LOCK
                        </div>
                      </div>

                      {/* Toggle Option 2: FPS Corner Tracker */}
                      <div className="p-3 bg-[#09090B]/50 border border-white/[0.02] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-white/5 text-slate-500">
                            <Eye className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400">Мини FPS Виджет</p>
                            <p className="text-[9px] text-slate-500">Постоянный счетчик в углу</p>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 px-2 py-1 rounded bg-white/5 border border-white/5">
                          LOCK
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.02] text-center mt-2 font-mono">
                    Визуальные фичи заблокированы администратором
                  </div>
                </div>

              </div>

              {/* Active Voice Chat Participants - Real-time Voice Section */}
              <div className="bg-[#17171C] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <span className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Участники голосовой сессии ({activeVoiceChannelName || 'Вне звонка'})
                  </span>
                  <button
                    onClick={toggleMute}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                      isMuted 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isMuted ? 'Микрофон выключен' : 'Микрофон включен'}</span>
                  </button>
                </div>

                {participants.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-[#A1A1AA]">
                      Вы не подключены к голосовому звонку. Нажмите <strong className="text-[#22D3EE]">«Позвонить»</strong> на вкладке друзей для WebRTC-звонка!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {participants.map((p) => (
                      <div
                        key={p.user.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#09090B] border border-white/[0.04] hover:border-[#22D3EE]/20 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={p.user.avatar} alt={p.user.displayName} size="sm" isSpeaking={p.isSpeaking} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#F5F5F7] truncate">{p.user.displayName}</div>
                            <div className="text-[9px] text-[#A1A1AA] font-mono">Громкость: {p.volume}%</div>
                          </div>
                        </div>

                        {p.isSpeaking && (
                          <AudioWaveform active={true} bars={4} height={16} colorClass="bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Hotkey Notice */}
            <div className="px-6 py-4 bg-[#17171C] border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#A1A1AA]">
              <span className="flex items-center gap-1.5">
                Нажмите <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] border border-white/10 text-[#F5F5F7]">Alt + U</kbd> или <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] border border-white/10 text-[#F5F5F7]">ESC</kbd> для переключения оверлея поверх игры.
              </span>
              <span className="text-[#22D3EE] font-bold tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]" /> PULSE OVERLAY v2.5
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
