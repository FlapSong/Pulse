// Real WebRTC P2P Voice Service for Pulse
// Enables real live voice calls between users across different PCs and networks using WebRTC APIs & AudioContext

import { API_BASE } from '../api/config';

type SignalMessage =
  | { type: 'join'; roomCode: string; senderId: string; senderName: string; avatar?: string }
  | { type: 'leave'; roomCode: string; senderId: string }
  | { type: 'offer'; roomCode: string; senderId: string; targetId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; roomCode: string; senderId: string; targetId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; roomCode: string; senderId: string; targetId: string; candidate: RTCIceCandidateInit }
  | { type: 'mute-status'; roomCode: string; senderId: string; isMuted: boolean }
  | { type: 'screen-share-status'; roomCode: string; senderId: string; isSharing: boolean; senderName?: string };

export interface PeerInfo {
  id: string;
  displayName: string;
  avatar?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  volume: number;
}

interface PeerConnectionEntry {
  pc: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[];
  remoteAudioElement?: HTMLAudioElement;
  remoteStream?: MediaStream;
}

class WebRTCVoiceService {
  private peerConnections = new Map<string, PeerConnectionEntry>();
  private localStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private remoteAnalyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private channel: BroadcastChannel | null = null;
  public roomCode: string | null = null;
  public userId: string = '';
  public userName: string = '';
  public userAvatar: string = '';

  private isMuted: boolean = false;
  private isKrispActive: boolean = true;
  private compressorNode: DynamicsCompressorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  private localScreenStream: MediaStream | null = null;
  private screenSenders = new Map<string, RTCRtpSender>();

  // Callbacks
  public onLocalVolume?: (volume: number, isSpeaking: boolean) => void;
  public onRemoteVolume?: (volume: number, isSpeaking: boolean) => void;
  public onPeerJoined?: (peer: PeerInfo) => void;
  public onPeerLeft?: (peerId: string) => void;
  public onPeerMuteChanged?: (peerId: string, isMuted: boolean) => void;
  public onRemoteScreenStream?: (stream: MediaStream | null, senderId: string) => void;
  public onRemoteScreenShareStateChanged?: (senderId: string, senderName: string, isSharing: boolean) => void;
  public onError?: (err: string) => void;

  private signalPoller: any = null;
  private lastSignalTime: number = 0;

  public async startVoiceSession(
    roomCode: string,
    user: { id: string; displayName: string; avatar?: string }
  ): Promise<boolean> {
    this.stopVoiceSession();

    this.roomCode = roomCode;
    this.userId = user.id;
    this.userName = user.displayName;
    this.userAvatar = user.avatar || '';
    this.lastSignalTime = Date.now() - 10000;

    // Initialize BroadcastChannel for local same-PC tabs
    try {
      this.channel = new BroadcastChannel(`pulse_room_${roomCode}`);
      this.channel.onmessage = (event) => this.handleSignalMessage(event.data);
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to network polling', e);
    }

    // Start network polling for cross-PC WebRTC signaling
    if (this.signalPoller) clearInterval(this.signalPoller);
    this.signalPoller = setInterval(() => this.pollNetworkSignals(), 600);

    // Get microphone input stream
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
    } catch (err: any) {
      console.warn('Microphone access denied or unavailable, switching to listen-only mode:', err);
      if (this.onError) {
        this.onError('Микрофон недоступен. Вы подключены в режиме только прослушивания.');
      }
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const dst = ctx.createMediaStreamDestination();
        this.localStream = dst.stream;
        this.isMuted = true;
      } catch (e) {
        console.warn('Fallback stream error:', e);
      }
    }

    // Setup AudioContext
    this.setupAudioNodes();

    // Broadcast join signal
    this.sendSignal({
      type: 'join',
      roomCode: this.roomCode,
      senderId: this.userId,
      senderName: this.userName,
      avatar: this.userAvatar
    });

    return true;
  }

  private async pollNetworkSignals() {
    if (!this.roomCode || !this.userId) return;
    try {
      const res = await fetch(`/api/calls/signals?roomId=${encodeURIComponent(this.roomCode)}&userId=${encodeURIComponent(this.userId)}&since=${this.lastSignalTime}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.signals) && data.signals.length > 0) {
        for (const sig of data.signals) {
          if (sig.timestamp >= this.lastSignalTime) {
            this.lastSignalTime = sig.timestamp + 1;
          }
          const msg: SignalMessage = {
            type: sig.type,
            roomCode: sig.roomId,
            senderId: sig.senderId,
            senderName: sig.payload?.senderName || sig.senderId,
            targetId: sig.targetId,
            sdp: sig.payload?.sdp,
            candidate: sig.payload?.candidate,
            isMuted: sig.payload?.isMuted
          } as any;

          await this.handleSignalMessage(msg);
        }
      }
    } catch (e) {
      // network hiccup catch
    }
  }

  private setupAudioNodes() {
    if (!this.localStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const source = this.audioContext.createMediaStreamSource(this.localStream);

      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'highpass';
      this.filterNode.frequency.value = this.isKrispActive ? 150 : 10;

      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.value = -30;
      this.compressorNode.knee.value = 10;
      this.compressorNode.ratio.value = 12;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      this.localAnalyser = this.audioContext.createAnalyser();
      this.localAnalyser.fftSize = 256;

      source.connect(this.filterNode);
      this.filterNode.connect(this.compressorNode);
      this.compressorNode.connect(this.localAnalyser);

      const dest = this.audioContext.createMediaStreamDestination();
      this.compressorNode.connect(dest);
      this.processedStream = dest.stream;

      this.startAudioVolumeMonitoring();
    } catch (e) {
      console.warn('AudioContext setup error:', e);
      this.processedStream = this.localStream;
    }
  }

  private startAudioVolumeMonitoring() {
    const localData = new Uint8Array(128);
    const remoteData = new Uint8Array(128);

    const checkVolume = () => {
      if (this.localAnalyser && !this.isMuted) {
        this.localAnalyser.getByteFrequencyData(localData);
        let sum = 0;
        for (let i = 0; i < localData.length; i++) {
          sum += localData[i];
        }
        const average = sum / localData.length;
        const volPercent = Math.min(100, Math.round((average / 128) * 100));
        const isSpeaking = volPercent > 8;
        if (this.onLocalVolume) {
          this.onLocalVolume(volPercent, isSpeaking);
        }
      } else {
        if (this.onLocalVolume) this.onLocalVolume(0, false);
      }

      if (this.remoteAnalyser) {
        this.remoteAnalyser.getByteFrequencyData(remoteData);
        let sum = 0;
        for (let i = 0; i < remoteData.length; i++) {
          sum += remoteData[i];
        }
        const average = sum / remoteData.length;
        const volPercent = Math.min(100, Math.round((average / 128) * 100));
        const isSpeaking = volPercent > 8;
        if (this.onRemoteVolume) {
          this.onRemoteVolume(volPercent, isSpeaking);
        }
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    checkVolume();
  }

  private getOrCreatePeerConnection(targetId: string): PeerConnectionEntry {
    const existing = this.peerConnections.get(targetId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

    const remoteAudioElement = document.createElement('audio');
    remoteAudioElement.autoplay = true;
    remoteAudioElement.setAttribute('playsinline', 'true');
    document.body.appendChild(remoteAudioElement);

    const entry: PeerConnectionEntry = {
      pc,
      pendingCandidates: [],
      remoteAudioElement
    };

    const streamToSend = this.processedStream || this.localStream;
    if (streamToSend) {
      streamToSend.getTracks().forEach((track) => {
        pc.addTrack(track, streamToSend!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && this.roomCode) {
        this.sendSignal({
          type: 'ice-candidate',
          roomCode: this.roomCode,
          senderId: this.userId,
          targetId: targetId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.track.kind === 'video') {
        const videoStream = event.streams[0] || new MediaStream([event.track]);
        if (this.onRemoteScreenStream) {
          this.onRemoteScreenStream(videoStream, targetId);
        }
        return;
      }

      if (event.streams && event.streams[0]) {
        entry.remoteStream = event.streams[0];
        if (entry.remoteAudioElement) {
          entry.remoteAudioElement.srcObject = entry.remoteStream;
          entry.remoteAudioElement.play().catch((err) => console.warn('Audio play error:', err));
        }

        if (this.audioContext) {
          try {
            if (this.audioContext.state === 'suspended') {
              this.audioContext.resume().catch(() => {});
            }
            const remoteSource = this.audioContext.createMediaStreamSource(entry.remoteStream);
            this.remoteAnalyser = this.audioContext.createAnalyser();
            this.remoteAnalyser.fftSize = 256;
            remoteSource.connect(this.remoteAnalyser);
          } catch (e) {
            console.warn('Remote audio analyzer error:', e);
          }
        }
      }
    };

    this.peerConnections.set(targetId, entry);
    return entry;
  }

  private async drainPendingCandidates(entry: PeerConnectionEntry) {
    if (!entry.pc.remoteDescription) return;
    while (entry.pendingCandidates.length > 0) {
      const candidate = entry.pendingCandidates.shift();
      if (candidate) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Failed to drain ICE candidate:', e);
        }
      }
    }
  }

  private async handleSignalMessage(msg: SignalMessage) {
    if (!this.roomCode || msg.roomCode !== this.roomCode) return;
    if (msg.senderId === this.userId) return;

    switch (msg.type) {
      case 'join': {
        if (this.onPeerJoined) {
          this.onPeerJoined({
            id: msg.senderId,
            displayName: msg.senderName,
            avatar: msg.avatar,
            isMuted: false,
            isSpeaking: false,
            volume: 0
          });
        }

        // To prevent WebRTC offer glare when both peers send join at the same time:
        // The peer with lower ID initiates the offer, the other peer waits for the offer.
        if (this.userId < msg.senderId) {
          const entry = this.getOrCreatePeerConnection(msg.senderId);
          const offer = await entry.pc.createOffer({ offerToReceiveAudio: true });
          await entry.pc.setLocalDescription(offer);

          this.sendSignal({
            type: 'offer',
            roomCode: this.roomCode,
            senderId: this.userId,
            targetId: msg.senderId,
            sdp: offer
          });
        }
        break;
      }

      case 'offer': {
        if (msg.targetId !== this.userId) return;

        if (this.onPeerJoined) {
          this.onPeerJoined({
            id: msg.senderId,
            displayName: (msg as any).senderName || 'Кент (Голос)',
            isMuted: false,
            isSpeaking: false,
            volume: 0
          });
        }

        const entry = this.getOrCreatePeerConnection(msg.senderId);
        await entry.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        await this.drainPendingCandidates(entry);

        const answer = await entry.pc.createAnswer();
        await entry.pc.setLocalDescription(answer);

        this.sendSignal({
          type: 'answer',
          roomCode: this.roomCode,
          senderId: this.userId,
          targetId: msg.senderId,
          sdp: answer
        });
        break;
      }

      case 'answer': {
        if (msg.targetId !== this.userId) return;
        const entry = this.peerConnections.get(msg.senderId);
        if (entry) {
          await entry.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          await this.drainPendingCandidates(entry);
        }
        break;
      }

      case 'ice-candidate': {
        if (msg.targetId !== this.userId) return;
        const entry = this.getOrCreatePeerConnection(msg.senderId);
        if (entry.pc.remoteDescription && entry.pc.remoteDescription.type) {
          try {
            await entry.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {
            console.warn('Failed to add ICE candidate:', e);
          }
        } else {
          entry.pendingCandidates.push(msg.candidate);
        }
        break;
      }

      case 'mute-status': {
        if (this.onPeerMuteChanged) {
          this.onPeerMuteChanged(msg.senderId, msg.isMuted);
        }
        break;
      }

      case 'screen-share-status': {
        if (this.onRemoteScreenShareStateChanged) {
          this.onRemoteScreenShareStateChanged(msg.senderId, (msg as any).senderName || 'Участник', msg.isSharing);
        }
        if (!msg.isSharing && this.onRemoteScreenStream) {
          this.onRemoteScreenStream(null, msg.senderId);
        }
        break;
      }

      case 'leave': {
        if (this.onPeerLeft) {
          this.onPeerLeft(msg.senderId);
        }
        const entry = this.peerConnections.get(msg.senderId);
        if (entry) {
          entry.pc.close();
          if (entry.remoteAudioElement) {
            entry.remoteAudioElement.pause();
            entry.remoteAudioElement.remove();
          }
          this.peerConnections.delete(msg.senderId);
        }
        break;
      }
    }
  }

  private sendSignal(msg: SignalMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {}
    }
    if (this.roomCode) {
      fetch(API_BASE + '/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomCode,
          senderId: this.userId,
          targetId: (msg as any).targetId || null,
          type: msg.type,
          payload: {
            senderName: this.userName,
            avatar: this.userAvatar,
            sdp: (msg as any).sdp,
            candidate: (msg as any).candidate,
            isMuted: (msg as any).isMuted
          }
        })
      }).catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (this.roomCode) {
      this.sendSignal({
        type: 'mute-status',
        roomCode: this.roomCode,
        senderId: this.userId,
        isMuted: muted
      });
    }
  }

  public setKrisp(active: boolean) {
    this.isKrispActive = active;
    if (this.filterNode) {
      if (active) {
        this.filterNode.frequency.setValueAtTime(150, this.audioContext?.currentTime || 0);
      } else {
        this.filterNode.frequency.setValueAtTime(10, this.audioContext?.currentTime || 0);
      }
    }
  }

  public attachScreenStream(stream: MediaStream) {
    this.localScreenStream = stream;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    this.peerConnections.forEach((entry, peerId) => {
      try {
        const sender = entry.pc.addTrack(videoTrack, stream);
        this.screenSenders.set(peerId, sender);
        entry.pc.createOffer({ offerToReceiveVideo: true }).then((offer) => {
          entry.pc.setLocalDescription(offer);
          if (this.roomCode) {
            this.sendSignal({
              type: 'offer',
              roomCode: this.roomCode,
              senderId: this.userId,
              targetId: peerId,
              sdp: offer
            });
          }
        }).catch((e) => console.warn('Offer creation error for screen track:', e));
      } catch (e) {
        console.warn('Error adding screen track to peer:', e);
      }
    });

    if (this.roomCode) {
      this.sendSignal({
        type: 'screen-share-status',
        roomCode: this.roomCode,
        senderId: this.userId,
        isSharing: true,
        senderName: this.userName
      });
    }
  }

  public detachScreenStream() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((t) => t.stop());
      this.localScreenStream = null;
    }

    this.peerConnections.forEach((entry, peerId) => {
      const sender = this.screenSenders.get(peerId);
      if (sender) {
        try {
          entry.pc.removeTrack(sender);
        } catch (e) {}
      }
    });
    this.screenSenders.clear();

    if (this.roomCode) {
      this.sendSignal({
        type: 'screen-share-status',
        roomCode: this.roomCode,
        senderId: this.userId,
        isSharing: false,
        senderName: this.userName
      });
    }
  }

  public stopVoiceSession() {
    if (this.signalPoller) {
      clearInterval(this.signalPoller);
      this.signalPoller = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.roomCode) {
      this.sendSignal({
        type: 'leave',
        roomCode: this.roomCode,
        senderId: this.userId
      });
    }

    if (this.channel) {
      try {
        this.channel.close();
      } catch (e) {}
      this.channel = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.peerConnections.forEach((entry) => {
      entry.pc.close();
      if (entry.remoteAudioElement) {
        entry.remoteAudioElement.pause();
        entry.remoteAudioElement.remove();
      }
    });
    this.peerConnections.clear();

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.roomCode = null;
  }
}

export const webrtcVoice = new WebRTCVoiceService();

