import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  X,
  Maximize2,
  Minimize2,
  Cast,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
  Laptop,
  Users
} from 'lucide-react';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { useUserStore } from '../../entities/user/userStore';
import { webrtcVoice } from '../../shared/services/webrtcVoice';

export const ScreenShareWindow: React.FC = () => {
  const {
    isScreenSharing,
    toggleScreenShare,
    activeVoiceChannelName,
    participants,
    remoteScreenStream,
    remoteScreenSharer,
    isRemoteScreenSharing
  } = useVoiceStore();
  const { currentUser } = useUserStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isLocalSharer = isScreenSharing;
  const isRemoteSharer = !isLocalSharer && (isRemoteScreenSharing || !!remoteScreenStream);

  const activeStream = isLocalSharer ? localStream : remoteScreenStream;
  const sharerName = isLocalSharer
    ? currentUser.displayName
    : remoteScreenSharer?.name || 'Участник звонка';

  // Real Screen Share stream activation for local user
  const startRealScreenShare = async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: false
      });

      setLocalStream(mediaStream);
      webrtcVoice.attachScreenStream(mediaStream);

      // Listen for stream stopping externally (e.g. Chrome's "Stop sharing" bar)
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.warn('Real getDisplayMedia failed or was cancelled:', err);
      setError(
        'Браузер блокирует доступ к трансляции экрана внутри встроенного фрейма (iframe) AI Studio. ' +
        'Пожалуйста, откройте это приложение в отдельной вкладке (кнопка «Открыть в новой вкладке» сверху справа), чтобы запустить трансляцию без ограничений!'
      );
    }
  };

  const stopScreenShare = () => {
    webrtcVoice.detachScreenStream();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (isScreenSharing) {
      toggleScreenShare();
    }
  };

  // Start sharing automatically when isScreenSharing turns true
  useEffect(() => {
    if (isLocalSharer) {
      startRealScreenShare();
    } else {
      if (localStream) {
        webrtcVoice.detachScreenStream();
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    }

    return () => {
      if (localStream) {
        webrtcVoice.detachScreenStream();
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isLocalSharer]);

  // Bind video element to media stream (local or remote)
  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch(err => console.error('Error playing screen video:', err));
    }
  }, [activeStream]);

  if (!isLocalSharer && !isRemoteSharer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className={`fixed z-50 bg-[#111113] border border-[#22D3EE]/50 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.25)] flex flex-col transition-all duration-300 ${
          isMaximized
            ? 'top-4 bottom-20 left-4 right-4 md:left-24 md:right-24'
            : 'bottom-20 right-4 w-[340px] sm:w-[420px] h-[240px] sm:h-[280px]'
        }`}
      >
        {/* Stream Header */}
        <div className="h-11 px-4 bg-[#17171C] border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Laptop className="w-4 h-4 text-[#22D3EE] shrink-0" />
            <span className="text-[11px] font-bold text-white truncate">
              Экран пользователя: {sharerName}
            </span>
            <span className="text-[9px] font-mono bg-[#22D3EE]/15 text-[#22D3EE] px-1.5 py-0.5 rounded border border-[#22D3EE]/30">
              {isLocalSharer ? 'ВАШ СТРИМ' : 'LIVE STREAM'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Open in new tab instruction for iframe environments */}
            <a
              href={window.location.href}
              target="_blank"
              rel="noreferrer"
              title="Открыть в новом окне для реальной демонстрации"
              className="p-1.5 rounded-lg bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 text-[#22D3EE] hover:text-white border border-[#22D3EE]/20 transition-all cursor-pointer text-[10px] font-mono flex items-center gap-1 px-2 shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Открыть в новой вкладке</span>
            </a>

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? 'Свернуть' : 'Развернуть'}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/[0.04] transition-all cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {isLocalSharer && (
              <button
                onClick={stopScreenShare}
                title="Остановить трансляцию"
                className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all cursor-pointer border border-rose-500/30"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video stream container */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden group">
          {error ? (
            <div className="p-6 text-center max-w-sm flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ограничение песочницы iframe</h4>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  {error}
                </p>
              </div>
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#22D3EE] hover:bg-[#06b6d4] text-[#09090B] text-xs font-bold transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                Открыть в новой вкладке 🚀
              </a>
            </div>
          ) : activeStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isLocalSharer}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] animate-pulse">
                <Monitor className="w-5 h-5" />
              </div>
              <span className="text-xs text-[#A1A1AA]">Инициализация захвата экрана...</span>
            </div>
          )}

          {/* Player controls overlay on hover */}
          {activeStream && !error && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
              <div className="flex items-center justify-between">
                {/* Left Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPaused) {
                          videoRef.current.play();
                        } else {
                          videoRef.current.pause();
                        }
                      }
                      setIsPaused(!isPaused);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>

                  <div className="text-xs text-white/90">
                    <span className="font-bold">{activeVoiceChannelName || 'В эфире'}</span>
                    <span className="text-slate-400 block text-[10px]">Качество: 1080p @ 60 FPS • Real Stream</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer (shows up only when maximized) */}
        {isMaximized && (
          <div className="px-4 py-3 bg-[#17171C] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#A1A1AA] shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Зрители трансляции: <strong className="text-white">{participants.length}</strong></span>
            </div>
            <span className="font-mono text-cyan-300 flex items-center gap-1">
              <Cast className="w-3.5 h-3.5 animate-pulse" /> ТРАНСЛЯЦИЯ В РЕАЛЬНОМ ВРЕМЕНИ
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
