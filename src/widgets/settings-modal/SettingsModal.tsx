import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  Mic,
  Monitor,
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
  Layers
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
    isStreamerModeActive, 
    toggleStreamerMode, 
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
    isOverlayEnabled,
    toggleOverlayEnabled
  } = useGameStore();
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('PULSE_API_BASE') || '');

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
            onClick={() => setActiveSettingsTab('overlay')}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeSettingsTab === 'overlay'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-purple-400" />
            <span>Игровой оверлей</span>
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
            onClick={() => setActiveSettingsTab('streamer')}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeSettingsTab === 'streamer'
                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <EyeOff className="w-4 h-4 text-rose-400" />
            <span>Режим стримера</span>
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
            onClick={() => setActiveSettingsTab('network')}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
              activeSettingsTab === 'network'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Сетевые настройки</span>
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

            {activeSettingsTab === 'streamer' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Скрыть Email и Личный IP</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Автоматически скрывать конфиденциальную информацию пользователя во время захвата экрана в OBS.
                    </div>
                  </div>
                  <button
                    onClick={toggleStreamerMode}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      isStreamerModeActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isStreamerModeActive ? 'АКТИВЕН' : 'ВЫКЛ'}
                  </button>
                </div>
              </div>
            )}

            {activeSettingsTab === 'overlay' && (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="font-bold text-white text-base">Оверлей в разработке</div>
                <div className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Настройки и функционал игрового оверлея находятся в процессе активной разработки.
                </div>
              </div>
            )}

            {activeSettingsTab === 'performance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Аппаратное ускорение</div>
                    <div className="text-emerald-400 font-bold text-sm mt-1">GPU ускорение (DirectX 12)</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Использование ОЗУ</div>
                    <div className="text-indigo-400 font-bold text-sm mt-1">{performanceMetrics.ramUsageGb} GB</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">FPS</div>
                    <div className="text-emerald-400 font-bold text-sm mt-1">{performanceMetrics.fps} FPS</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Ping</div>
                    <div className="text-sky-400 font-bold text-sm mt-1">{performanceMetrics.pingMs} ms</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Frame Time</div>
                    <div className="text-amber-400 font-bold text-sm mt-1">{performanceMetrics.frameTimeMs} ms</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">GPU Usage</div>
                    <div className="text-rose-400 font-bold text-sm mt-1">{performanceMetrics.gpuUsagePercent}%</div>
                  </div>
                </div>
              </div>
            )}

            {activeSettingsTab === 'network' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" /> Конфигурация API
                  </h4>
                  <p className="text-slate-400 text-[11px] mb-4">
                    Используется для подключения десктопного приложения к вашему облачному серверу Pulse.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-300 font-semibold mb-2 block">
                        URL сервера API
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={apiUrl}
                          onChange={(e) => saveApiUrl(e.target.value)}
                          placeholder="Напр. https://your-app.run.app"
                          className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition-all"
                        />
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">
                        Оставьте пустым, чтобы использовать локальный сервер (http://localhost:3000).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="text-blue-300 font-semibold mb-1">Совет для Electron</div>
                      <div className="text-[11px] text-blue-400/80 leading-relaxed">
                        Чтобы войти в свой аккаунт из веб-версии, скопируйте адрес текущей страницы (без /login) и вставьте его сюда. После этого перезагрузите приложение.
                      </div>
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
