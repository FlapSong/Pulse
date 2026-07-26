import React, { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, PhoneCall } from 'lucide-react';
import { useUserStore } from '../../entities/user/userStore';
import { useVoiceStore } from '../../entities/voice/voiceStore';
import { soundService } from '../../shared/services/soundService';

interface IncomingCallData {
  signalId?: string;
  roomId: string;
  callerId: string;
  callerName: string;
  avatar?: string;
}

export const IncomingCallOverlay: React.FC = () => {
  const { currentUser } = useUserStore();
  const { connectToVoice, activeVoiceChannelId } = useVoiceStore();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const handledSignalIdsRef = useRef<Set<string>>(new Set());

  const isDnd = currentUser?.status === 'dnd' || (
    currentUser?.customStatus && (
      currentUser.customStatus.toLowerCase().includes('не беспокоить') ||
      currentUser.customStatus.toLowerCase().includes('dnd')
    )
  );

  useEffect(() => {
    if (!currentUser || !currentUser.username || isDnd) return;

    const checkCalls = async () => {
      try {
        const res = await fetch(`/api/calls/incoming?userId=${encodeURIComponent(currentUser.username)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.incomingCalls) && data.incomingCalls.length > 0) {
          const call = data.incomingCalls[0];
          
          if (handledSignalIdsRef.current.has(call.id)) {
            return;
          }

          if (activeVoiceChannelId === call.roomId) {
            handledSignalIdsRef.current.add(call.id);
            soundService.stopCallRing();
            setIncomingCall(null);
            fetch('/api/calls/dismiss', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ signalId: call.id, targetId: currentUser.username, roomId: call.roomId })
            }).catch(() => {});
            return;
          }

          setIncomingCall((prev) => {
            if (!prev || prev.roomId !== call.roomId) {
              soundService.startIncomingCallRing();
            }
            return {
              signalId: call.id,
              roomId: call.roomId,
              callerId: call.callerId,
              callerName: call.payload?.callerName || call.callerId,
              avatar: call.payload?.avatar
            };
          });
        } else {
          setIncomingCall((prev) => {
            if (prev) {
              soundService.stopCallRing();
            }
            return null;
          });
        }
      } catch (e) {
        // network silent
      }
    };

    checkCalls();
    const interval = setInterval(checkCalls, 1500);

    return () => {
      clearInterval(interval);
      soundService.stopCallRing();
    };
  }, [currentUser, activeVoiceChannelId, isDnd]);

  useEffect(() => {
    if (isDnd) {
      soundService.stopCallRing();
      setIncomingCall(null);
    }
  }, [isDnd]);

  if (!incomingCall || isDnd) return null;

  const dismissCurrentCall = (signalId?: string, roomId?: string) => {
    soundService.stopCallRing();
    if (signalId) {
      handledSignalIdsRef.current.add(signalId);
    }
    setIncomingCall(null);

    fetch('/api/calls/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signalId,
        targetId: currentUser?.username,
        roomId
      })
    }).catch(() => {});
  };

  const handleAccept = () => {
    const callData = incomingCall;
    dismissCurrentCall(callData.signalId, callData.roomId);
    connectToVoice(callData.roomId, `Звонок: @${callData.callerName}`);
  };

  const handleDecline = () => {
    dismissCurrentCall(incomingCall.signalId, incomingCall.roomId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121216] border border-emerald-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl shadow-emerald-500/20">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <PhoneCall className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Входящий звонок</h3>
        <p className="text-sm text-emerald-400 font-mono mb-6">
          Пользователь @{incomingCall.callerName} вызывает вас в голосовой звонок
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={handleAccept}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/30"
          >
            <Phone className="w-4 h-4" />
            <span>Принять</span>
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Отклонить</span>
          </button>
        </div>
      </div>
    </div>
  );
};
