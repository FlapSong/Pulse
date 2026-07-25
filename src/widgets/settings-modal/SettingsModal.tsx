import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  Mic,
  Key,
  EyeOff,
  Activity,
  Sparkles,
  Sliders,
  Zap,
  LogOut,
  ChevronDown,
  Globe,
  Server,
  Terminal,
  Lock,
  Unlock
} from 'lucide-react';
import { useGameStore } from '../../entities/game/gameStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { useUserStore } from '../../entities/user/userStore';
import { normalizeToEnglish } from '../../lib/hotkeyUtils';

const StyledSelect = ({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[] 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white flex items-center justify-between cursor-pointer hover:border-slate-500 transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50"
      >
        <span className="truncate pr-4">{selected?.label || 'Выберите устройство'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {options.map((option) => (
              <div 
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer text-slate-200 hover:text-white hover:bg-slate-800 transition-colors ${value === option.value ? 'bg-slate-800 text-white' : ''}`}
              >
                {option.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SettingsModal: React.FC = () => {
  const { 
    logout, 
    muteMicHotkey, 
    setMuteMicHotkey,
    deafenHotkey,
    setDeafenHotkey 
  } = useUserStore();
  const [recordingHotkey, setRecordingHotkey] = React.useState<'mute' | 'deafen' | null>(null);

  useEffect(() => {
    if (!recordingHotkey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if only a modifier key is pressed
      if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;

      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];
      if (e.altKey) keys.push('ALT');
      if (e.ctrlKey) keys.push('CTRL');
      if (e.shiftKey) keys.push('SHIFT');
      if (e.metaKey) keys.push('META');
      
      if (e.key) {
        keys.push(e.key.toUpperCase());
      }
      
      const newHotkey = keys.join('+');
      const normalized = normalizeToEnglish(newHotkey);
      
      if (recordingHotkey === 'mute') setMuteMicHotkey(normalized);
      if (recordingHotkey === 'deafen') setDeafenHotkey(normalized);
      
      setRecordingHotkey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingHotkey, setMuteMicHotkey, setDeafenHotkey]);
  const {
    settingsOpen,
    setSettingsOpen,
    activeSettingsTab,
    setActiveSettingsTab,
    performanceMetrics,
    isDevMode,
    setDevMode,
    setShowDevModeTransition
  } = useGameStore();
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('PULSE_API_BASE') || '');

  const [isEnteringDevPass, setIsEnteringDevPass] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [devPasswordError, setDevPasswordError] = useState(false);

  const handleDevSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (devPassword === '0101') {
      setShowDevModeTransition(true);
      setIsEnteringDevPass(false);
      setDevPassword('');
      setDevPasswordError(false);
      setSettingsOpen(false); // close settings to show transition
    } else {
      setDevPasswordError(true);
      setDevPassword('');
    }
  };

  const systemInfo = useMemo(() => {
    if (typeof window === 'undefined') return {
      os: 'Не определено',
      browser: 'Не определено',
      cpuCores: 'N/A',
      deviceMemory: 'N/A',
      gpu: 'WebGL не поддерживается',
      resolution: 'N/A',
      connection: 'Прямое соединение',
      hwAcceleration: 'Выключено'
    };

    const ua = navigator.userAgent;
    
    // OS detection
    let os = 'Unknown OS';
    if (ua.indexOf('Win') !== -1) os = 'Windows';
    else if (ua.indexOf('Mac') !== -1) os = 'macOS';
    else if (ua.indexOf('X11') !== -1) os = 'UNIX';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';

    // Browser detection
    let browser = 'Unknown Browser';
    if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1) browser = 'Google Chrome';
    else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') !== -1) browser = 'Mozilla Firefox';
    else if (ua.indexOf('Edg') !== -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) browser = 'Opera';

    // CPU Cores
    const cpuCores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'N/A';

    // Device Memory
    const deviceMemory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A';

    // GPU Info (WebGL)
    let gpu = 'WebGL Generic';
    let hwAcceleration = 'Выключено';
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        hwAcceleration = 'Включено (WebGL)';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer) {
            gpu = renderer;
            // Shorten/format typical GPU strings for clean UI
            if (gpu.includes('ANGLE (')) {
              const match = gpu.match(/ANGLE \(([^,]+), ([^,]+)/);
              if (match) {
                gpu = match[2];
              }
            }
          }
        }
      }
    } catch (e) {
      gpu = 'Ошибка определения';
    }

    // Screen resolution
    const resolution = `${window.screen.width}x${window.screen.height} (@${window.devicePixelRatio}x)`;

    // Network connection
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const connection = conn 
      ? `${(conn.effectiveType || '').toUpperCase()} (rtt: ${conn.rtt || '?'}ms, speed: ${conn.downlink || '?'}Mbps)`
      : 'Локальное / Локальная сеть';

    return {
      os,
      browser,
      cpuCores,
      deviceMemory,
      gpu,
      resolution,
      connection,
      hwAcceleration
    };
  }, []);

  const saveApiUrl = (url: string) => {
    setApiUrl(url);
    if (url) {
      localStorage.setItem('PULSE_API_BASE', url);
    } else {
      localStorage.removeItem('PULSE_API_BASE');
    }
  };

  const {
    isKrispActive,
    toggleKrisp,
    inputDevices,
    outputDevices,
    selectedInputDeviceId,
    selectedOutputDeviceId,
    setDevices,
    setSelectedInputDeviceId,
    setSelectedOutputDeviceId
  } = useVoiceStore();

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const inputs = devices.filter(d => d.kind === 'audioinput');
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      setDevices(inputs, outputs);
    });
  }, [setDevices]);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex h-[540px]"
      >
        {/* Left Settings Sidebar */}
        <div className="w-56 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-1 flex-shrink-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
            НАСТРОЙКИ PULSE
          </div>

          <button
            onClick={() => setActiveSettingsTab('audio')}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeSettingsTab === 'audio'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Голос и звук</span>
          </button>

          <button
            onClick={() => setActiveSettingsTab('hotkeys')}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeSettingsTab === 'hotkeys'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Горячие клавиши</span>
          </button>

          <button
            onClick={() => setActiveSettingsTab('performance')}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeSettingsTab === 'performance'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Производительность</span>
          </button>

          <button
            onClick={() => {
              setSettingsOpen(false);
              logout();
            }}
            className="w-full p-2.5 mt-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Выйти из аккаунта</span>
          </button>

          {/* Developer Mode Control Section */}
          {isDevMode ? (
            <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Режим разработчика</span>
              </div>
              <button
                onClick={async () => {
                  const { simulateFriendRequestServer } = useUserStore.getState();
                  await simulateFriendRequestServer();
                }}
                className="w-full py-1.5 bg-[#22D3EE]/15 hover:bg-[#22D3EE]/25 text-[#22D3EE] rounded-lg text-[10px] font-bold border border-[#22D3EE]/30 cursor-pointer text-center transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Тестовая заявка</span>
              </button>
              <button
                onClick={() => setDevMode(false)}
                className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold border border-rose-500/20 cursor-pointer text-center transition-all"
              >
                Отключить режим
              </button>
            </div>
          ) : (
            <div className="mt-2">
              {!isEnteringDevPass ? (
                <button
                  onClick={() => setIsEnteringDevPass(true)}
                  className="w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-slate-400 hover:text-white hover:bg-slate-900 transition-all text-left cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span>Режим разработчика</span>
                </button>
              ) : (
                <form onSubmit={handleDevSubmit} className="p-2 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Пароль</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEnteringDevPass(false);
                        setDevPassword('');
                        setDevPasswordError(false);
                      }}
                      className="text-slate-500 hover:text-slate-300 text-[9px]"
                    >
                      Отмена
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={devPassword}
                      onChange={(e) => {
                        setDevPassword(e.target.value);
                        setDevPasswordError(false);
                      }}
                      placeholder="••••"
                      maxLength={10}
                      autoFocus
                      className={`w-full bg-slate-900 border text-xs text-center py-1.5 rounded-lg text-white font-mono focus:outline-none transition-all ${
                        devPasswordError
                          ? 'border-rose-500 bg-rose-500/10 placeholder-rose-300'
                          : 'border-slate-700 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {devPasswordError && (
                    <div className="text-[9px] text-rose-400 text-center font-semibold">
                      Неверный пароль!
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer"
                  >
                    Активировать
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-slate-800 px-2 text-[10px] text-slate-500 font-mono">
            Pulse Desktop v2.0.0
          </div>
        </div>

        {/* Right Settings Panel */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          {/* Header */}
          <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white capitalize">
              {activeSettingsTab === 'audio' ? 'Настройки звука' : `${activeSettingsTab} Конфигурация`}
            </h3>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6 no-scrollbar text-xs">
            {activeSettingsTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <label className="text-slate-300 font-semibold mb-2 block">
                    Устройство ввода (Микрофон)
                  </label>
                  <StyledSelect
                    value={selectedInputDeviceId || ''}
                    onChange={setSelectedInputDeviceId}
                    options={inputDevices.map(d => ({ value: d.deviceId, label: d.label || `Микрофон ${d.deviceId.slice(0, 5)}` }))}
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-2 block">
                    Устройство вывода (Динамики/Наушники)
                  </label>
                  <StyledSelect
                    value={selectedOutputDeviceId || ''}
                    onChange={setSelectedOutputDeviceId}
                    options={outputDevices.map(d => ({ value: d.deviceId, label: d.label || `Динамики ${d.deviceId.slice(0, 5)}` }))}
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> Шумоподавление Krisp AI
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Удаляет щелчки механической клавиатуры, шум вентиляторов и фоновые голоса.
                    </div>
                  </div>
                  <button
                    onClick={toggleKrisp}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      isKrispActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isKrispActive ? 'Включено' : 'Выключено'}
                  </button>
                </div>
              </div>
            )}

             {activeSettingsTab === 'hotkeys' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Выключить микрофон (Mute)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Нажмите клавишу для быстрого включения/выключения микрофона.
                    </div>
                  </div>
                  <button
                    onClick={() => setRecordingHotkey('mute')}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                      recordingHotkey === 'mute'
                        ? 'bg-amber-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {recordingHotkey === 'mute' ? 'Нажмите клавиши...' : muteMicHotkey}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Заглушить пользователей (Deafen)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Нажмите клавишу для быстрого выключения звука у всех пользователей.
                    </div>
                  </div>
                  <button
                    onClick={() => setRecordingHotkey('deafen')}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                      recordingHotkey === 'deafen'
                        ? 'bg-amber-600 text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {recordingHotkey === 'deafen' ? 'Нажмите клавиши...' : deafenHotkey}
                  </button>
                </div>
              </div>
            )}

            {activeSettingsTab === 'performance' && (
              <div className="space-y-5">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                    Текущие показатели (Live Telemetry)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Частота кадров
                      </div>
                      <div className="text-emerald-400 font-bold text-base mt-1.5">{performanceMetrics.fps} <span className="text-xs font-semibold text-slate-500">FPS</span></div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Время кадра
                      </div>
                      <div className="text-amber-400 font-bold text-base mt-1.5">{performanceMetrics.frameTimeMs} <span className="text-xs font-semibold text-slate-500">ms</span></div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        Задержка сети (Ping)
                      </div>
                      <div className="text-sky-400 font-bold text-base mt-1.5">{performanceMetrics.pingMs} <span className="text-xs font-semibold text-slate-500">ms</span></div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        ОЗУ (JS Heap)
                      </div>
                      <div className="text-indigo-400 font-bold text-base mt-1.5">{performanceMetrics.ramUsageGb} <span className="text-xs font-semibold text-slate-500">GB</span></div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Загрузка GPU
                      </div>
                      <div className="text-rose-400 font-bold text-base mt-1.5">{performanceMetrics.gpuUsagePercent}%</div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Ускорение
                      </div>
                      <div className="text-emerald-400 font-semibold text-xs mt-1.5 truncate" title={systemInfo.hwAcceleration}>{systemInfo.hwAcceleration}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                    Характеристики системы (System Specs)
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-900">
                    <div className="p-3 flex items-center justify-between gap-4">
                      <span className="text-slate-400">Операционная система</span>
                      <span className="text-white font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-right">{systemInfo.os}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-4">
                      <span className="text-slate-400">Браузер</span>
                      <span className="text-white font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-right">{systemInfo.browser}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-4">
                      <span className="text-slate-400">Процессор (Ядра)</span>
                      <span className="text-indigo-300 font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-right">{systemInfo.cpuCores}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-4">
                      <span className="text-slate-400">Память устройства</span>
                      <span className="text-amber-300 font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-right">{systemInfo.deviceMemory}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-4">
                      <span className="text-slate-400">Видеокарта (GPU)</span>
                      <span className="text-rose-300 font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-right max-w-[280px] truncate" title={systemInfo.gpu}>{systemInfo.gpu}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-4">
                      <span className="text-slate-400">Разрешение экрана</span>
                      <span className="text-sky-300 font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-right">{systemInfo.resolution}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-4">
                      <span className="text-slate-400">Сетевой адаптер</span>
                      <span className="text-emerald-300 font-medium bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-right max-w-[280px] truncate" title={systemInfo.connection}>{systemInfo.connection}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
