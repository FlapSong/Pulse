export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface GameActivity {
  title: string;
  category: 'FPS' | 'MOBA' | 'RPG' | 'Action' | 'Strategy' | 'Indie';
  elapsedSeconds: number;
  mode?: string;
  partySize?: { current: number; max: number };
  iconUrl?: string;
  coverUrl?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  status: UserStatus;
  customStatus?: string;
  gameActivity?: GameActivity;
  role?: string;
  badge?: string;
  email?: string;
  isBot?: boolean;
}

export type ChannelType = 'text' | 'voice' | 'announcement' | 'stream';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  categoryId: string;
  topic?: string;
  isPrivate?: boolean;
  unreadCount?: number;
  userCount?: number;
}

export interface ChannelCategory {
  id: string;
  name: string;
  channelIds: string[];
}

export interface Community {
  id: string;
  name: string;
  icon: string;
  banner?: string;
  description: string;
  memberCount: number;
  onlineCount: number;
  categories: ChannelCategory[];
  channels: Channel[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'code' | 'file';
  url: string;
  name: string;
  size?: string;
}

export interface Message {
  id: string;
  channelId: string;
  author: User;
  content: string;
  timestamp: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  replyTo?: {
    id: string;
    authorName: string;
    contentSnippet: string;
  };
  isPinned?: boolean;
  isSystem?: boolean;
}

export interface VoiceParticipant {
  user: User;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  volume: number; // 0-100
  pingMs: number;
}

export interface DirectMessageThread {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}
