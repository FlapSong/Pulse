import { Community, User, DirectMessageThread, Message } from '../types';

export const CURRENT_USER: User = {
  id: 'u-phantom-001',
  username: 'phantom',
  displayName: 'Phantom',
  avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  status: 'online',
  customStatus: '⚡ В сети в Pulse',
  role: 'Pro Member',
  badge: 'PULSE USER'
};

export const MOCK_USERS: Record<string, User> = {};

// Clean minimal community space without fake channels or fake user statuses
export const INITIAL_COMMUNITIES: Community[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

export const INITIAL_DIRECT_THREADS: DirectMessageThread[] = [];

