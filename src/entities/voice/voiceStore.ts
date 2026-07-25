import { create } from 'zustand';
import { VoiceParticipant } from '../../shared/types';
import { useUserStore } from '../user/userStore';
import { webrtcVoice, PeerInfo } from '../../shared/services/webrtcVoice';
import { soundService } from '../../shared/services/soundService';

interface VoiceStore {
  activeVoiceChannelId: string | null;
  activeVoiceChannelName: string | null;
  roomCode: string | null;
  participants: VoiceParticipant[];
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  remoteScreenStream: MediaStream | null;
  remoteScreenSharer: { id: string; name: string } | null;
  isRemoteScreenSharing: boolean;
  isKrispActive: boolean;
  isSpatialAudioActive: boolean;
  bitrateKbps: number;
  pingMs: number;
  errorMessage: string | null;
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  selectedInputDeviceId: string | null;
  selectedOutputDeviceId: string | null;

  connectToVoice: (channelId: string, channelName: string) => Promise<void>;
  disconnectVoice: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => void;
  toggleKrisp: () => void;
  toggleSpatialAudio: () => void;
  setBitrate: (bitrate: number) => void;
  setParticipantVolume: (userId: string, volume: number) => void;
  setDevices: (inputDevices: MediaDeviceInfo[], outputDevices: MediaDeviceInfo[]) => void;
  setSelectedInputDeviceId: (deviceId: string) => void;
  setSelectedOutputDeviceId: (deviceId: string) => void;
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  activeVoiceChannelId: null,
  activeVoiceChannelName: null,
  roomCode: null,
  participants: [],
  isMuted: false,
  isDeafened: false,
  isScreenSharing: false,
  remoteScreenStream: null,
  remoteScreenSharer: null,
  isRemoteScreenSharing: false,
  isKrispActive: true,
  isSpatialAudioActive: true,
  bitrateKbps: 320,
  pingMs: 12,
  errorMessage: null,
  inputDevices: [],
  outputDevices: [],
  selectedInputDeviceId: null,
  selectedOutputDeviceId: null,

  connectToVoice: async (channelId: string, channelName: string) => {
    // Clean previous session if any
    webrtcVoice.stopVoiceSession();

    const currentUser = useUserStore.getState().currentUser;
    const roomCode = channelId.startsWith('room-') ? channelId : `room-${channelId}`;

    set({
      activeVoiceChannelId: channelId,
      activeVoiceChannelName: channelName,
      roomCode: roomCode,
      errorMessage: null,
      participants: [
        {
          user: currentUser,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
          isScreenSharing: false,
          volume: 100,
          pingMs: 12
        }
      ]
    });

    // Wire callbacks from WebRTC service
    webrtcVoice.onLocalVolume = (vol, isSpeaking) => {
      set((state) => ({
        participants: state.participants.map((p) =>
          p.user.id === currentUser.id
            ? { ...p, isSpeaking: state.isMuted ? false : isSpeaking }
            : p
        )
      }));
    };

    webrtcVoice.onRemoteVolume = (vol, isSpeaking) => {
      set((state) => ({
        participants: state.participants.map((p) =>
          p.user.id !== currentUser.id ? { ...p, isSpeaking, volume: vol } : p
        )
      }));
    };

    webrtcVoice.onPeerJoined = (peer: PeerInfo) => {
      set((state) => {
        const exists = state.participants.some((p) => p.user.id === peer.id);
        if (exists) return state;
        return {
          participants: [
            ...state.participants,
            {
              user: {
                id: peer.id,
                username: `peer_${peer.id.slice(-4)}`,
                displayName: peer.displayName,
                avatar:
                  peer.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                status: 'online',
                role: 'Друг (Голос)'
              },
              isMuted: peer.isMuted,
              isDeafened: false,
              isSpeaking: peer.isSpeaking,
              isScreenSharing: false,
              volume: 100,
              pingMs: 16
            }
          ]
        };
      });
    };

    webrtcVoice.onPeerLeft = (peerId: string) => {
      set((state) => ({
        participants: state.participants.filter((p) => p.user.id !== peerId)
      }));
    };

    webrtcVoice.onPeerMuteChanged = (peerId: string, isMuted: boolean) => {
      set((state) => ({
        participants: state.participants.map((p) =>
          p.user.id === peerId ? { ...p, isMuted } : p
        )
      }));
    };

    webrtcVoice.onRemoteScreenStream = (stream, senderId) => {
      set({ remoteScreenStream: stream });
    };

    webrtcVoice.onRemoteScreenShareStateChanged = (senderId, senderName, isSharing) => {
      set((state) => ({
        isRemoteScreenSharing: isSharing,
        remoteScreenSharer: isSharing ? { id: senderId, name: senderName } : null,
        remoteScreenStream: isSharing ? state.remoteScreenStream : null,
        participants: state.participants.map((p) =>
          p.user.id === senderId ? { ...p, isScreenSharing: isSharing } : p
        )
      }));
    };

    webrtcVoice.onError = (err) => {
      set({ errorMessage: err });
    };

    const success = await webrtcVoice.startVoiceSession(roomCode, {
      id: currentUser.id,
      displayName: currentUser.displayName,
      avatar: currentUser.avatar
    });

    if (success) {
      soundService.playJoinChannel();

      // DM Call join sound
      if (channelId.includes('call-')) {
        // no mock friend
      }
    } else {
      set({
        activeVoiceChannelId: null,
        activeVoiceChannelName: null,
        roomCode: null
      });
    }
  },

  disconnectVoice: () => {
    webrtcVoice.stopVoiceSession();
    soundService.playLeaveChannel();
    set({
      activeVoiceChannelId: null,
      activeVoiceChannelName: null,
      roomCode: null,
      participants: [],
      isMuted: false,
      isDeafened: false,
      isScreenSharing: false,
      remoteScreenStream: null,
      remoteScreenSharer: null,
      isRemoteScreenSharing: false,
      errorMessage: null
    });
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    webrtcVoice.setMuted(nextMuted);
    const currentUser = useUserStore.getState().currentUser;

    set((state) => ({
      isMuted: nextMuted,
      participants: state.participants.map((p) =>
        p.user.id === currentUser.id ? { ...p, isMuted: nextMuted } : p
      )
    }));
  },

  toggleDeafen: () => {
    const nextDeafened = !get().isDeafened;
    const currentUser = useUserStore.getState().currentUser;

    set((state) => ({
      isDeafened: nextDeafened,
      isMuted: nextDeafened ? true : state.isMuted,
      participants: state.participants.map((p) =>
        p.user.id === currentUser.id
          ? { ...p, isDeafened: nextDeafened, isMuted: nextDeafened ? true : p.isMuted }
          : p
      )
    }));
  },

  toggleScreenShare: () => {
    const nextSharing = !get().isScreenSharing;
    const currentUser = useUserStore.getState().currentUser;

    set((state) => ({
      isScreenSharing: nextSharing,
      participants: state.participants.map((p) =>
        p.user.id === currentUser.id ? { ...p, isScreenSharing: nextSharing } : p
      )
    }));
  },

  toggleKrisp: () => {
    const nextKrisp = !get().isKrispActive;
    webrtcVoice.setKrisp(nextKrisp);
    set({ isKrispActive: nextKrisp });
  },

  toggleSpatialAudio: () =>
    set((state) => ({ isSpatialAudioActive: !state.isSpatialAudioActive })),

  setBitrate: (bitrate) => set({ bitrateKbps: bitrate }),

  setParticipantVolume: (userId, volume) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.user.id === userId ? { ...p, volume } : p
      )
    })),

  setDevices: (inputDevices, outputDevices) => set({ inputDevices, outputDevices }),
  setSelectedInputDeviceId: (selectedInputDeviceId) => set({ selectedInputDeviceId }),
  setSelectedOutputDeviceId: (selectedOutputDeviceId) => set({ selectedOutputDeviceId })
}));
