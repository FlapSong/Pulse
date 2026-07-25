import { create } from 'zustand';
import { Message, User } from '../../shared/types';
import { INITIAL_MESSAGES } from '../../shared/config/initialData';
import { soundService } from '../../shared/services/soundService';
import { useUserStore } from '../user/userStore';
import { useGameStore } from '../game/gameStore';
import { API_BASE } from '../../shared/api/config';

interface ChatStore {
  messagesByChannel: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  activeChatUser: User | null;
  replyingToMessage: Message | null;
  pinnedFilterActive: boolean;

  fetchChannelMessages: (channelId: string) => Promise<void>;
  fetchDirectMessages: (senderUsername: string, recipientUsername: string) => Promise<void>;
  pollAllDirectMessages: (currentUsername: string, isCurrentTabDm: boolean) => Promise<void>;
  clearDirectMessagesServer: (threadId: string, currentUsername: string, targetUsername: string) => Promise<void>;
  simulateIncomingMessage: (recipientUsername: string, botName?: string, messageText?: string) => Promise<void>;
  sendMessage: (channelId: string, author: User, content: string, attachments?: any[], replyTo?: Message['replyTo'], recipientUsername?: string) => Promise<void>;
  incrementUnreadCount: (channelId: string) => void;
  markAsRead: (channelId: string) => void;
  setActiveChatUser: (user: User | null) => void;
  toggleReaction: (channelId: string, messageId: string, emoji: string, userId: string) => Promise<void>;
  togglePinMessage: (channelId: string, messageId: string) => void;
  setReplyingToMessage: (message: Message | null) => void;
  setPinnedFilterActive: (active: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messagesByChannel: INITIAL_MESSAGES,
  unreadCounts: {},
  activeChatUser: null,
  replyingToMessage: null,
  pinnedFilterActive: false,

  fetchChannelMessages: async (channelId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?channelId=${encodeURIComponent(channelId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        set((state) => ({
          messagesByChannel: {
            ...state.messagesByChannel,
            [channelId]: data.messages
          }
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch channel messages:', e);
    }
  },

  fetchDirectMessages: async (senderUsername: string, recipientUsername: string) => {
    if (!senderUsername || !recipientUsername) return;
    const threadId = ['dm', senderUsername, recipientUsername].sort().join('-');
    try {
      const res = await fetch(`/api/chat/direct?user1=${encodeURIComponent(senderUsername)}&user2=${encodeURIComponent(recipientUsername)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        set((state) => {
          const prev = state.messagesByChannel[threadId] || [];
          if (data.messages.length > prev.length) {
            // Sound notification for new incoming messages
            const lastPrev = prev[prev.length - 1];
            const lastNew = data.messages[data.messages.length - 1];
            if (lastNew && lastPrev && lastNew.id !== lastPrev.id && lastNew.author?.username?.toLowerCase() !== senderUsername.toLowerCase()) {
              soundService.playMessage();
            }
          }
          return {
            messagesByChannel: {
              ...state.messagesByChannel,
              [threadId]: data.messages
            }
          };
        });
      }
    } catch (e) {
      console.warn('Failed to fetch direct messages:', e);
    }
  },

  pollAllDirectMessages: async (currentUsername: string, isCurrentTabDm: boolean) => {
    if (!currentUsername) return;
    try {
      const res = await fetch(`/api/chat/direct/all?username=${encodeURIComponent(currentUsername)}`);
      const data = await res.json();
      if (data.success && data.messagesByThread) {
        set((state) => {
          const updatedMessagesByChannel = { ...state.messagesByChannel };
          const updatedUnreadCounts = { ...state.unreadCounts };
          let shouldPlaySound = false;

          Object.entries(data.messagesByThread as Record<string, Message[]>).forEach(([threadId, rawMsgs]) => {
            const newMsgs = rawMsgs.filter(m => !m.content.includes('тестовое') && !m.content.includes('симулированное'));
            const isDev = useGameStore.getState().isDevMode;
            const TEST_LOGINS = ['phantom', 'cyber_friend', 'pro_gamer_777', 'speed_demon', 'shadow_ninja', 'aim_master', 'neon_pulse'];
            
            // Filter out threads from test users if not in dev mode
            if (!isDev) {
              const otherUser = threadId.split('-').find(u => u !== 'dm' && u !== currentUsername.toLowerCase());
              if (otherUser && TEST_LOGINS.includes(otherUser)) {
                return;
              }
            }

            const prevMsgs = state.messagesByChannel[threadId];
            const isFirstFetchForThread = prevMsgs === undefined;
            const prevMsgsArr = prevMsgs || [];

            if (newMsgs.length > prevMsgsArr.length) {
              const freshMsgs = newMsgs.slice(prevMsgsArr.length);
              const incomingFresh = freshMsgs.filter(
                (m) => m.author?.username?.toLowerCase() !== currentUsername.toLowerCase()
              );

              if (incomingFresh.length > 0) {
                if (!isFirstFetchForThread) {
                  shouldPlaySound = true;
                }

                const activeDmUsername = state.activeChatUser?.username?.toLowerCase();
                const isChattingWithThisSender =
                  isCurrentTabDm &&
                  activeDmUsername &&
                  threadId.toLowerCase().includes(activeDmUsername);

                if (!isChattingWithThisSender) {
                  if (isFirstFetchForThread) {
                    const unreadCount = incomingFresh.filter(m => !(m as any).readStatus).length;
                    updatedUnreadCounts[threadId] = unreadCount;
                  } else {
                    updatedUnreadCounts[threadId] = (updatedUnreadCounts[threadId] || 0) + incomingFresh.length;
                  }
                }
              }
            }

            updatedMessagesByChannel[threadId] = newMsgs;
          });

          if (shouldPlaySound) {
            soundService.playMessage();
          }

          return {
            messagesByChannel: updatedMessagesByChannel,
            unreadCounts: updatedUnreadCounts
          };
        });
      }
    } catch (e) {
      console.warn('Failed to poll all direct messages:', e);
    }
  },

  clearDirectMessagesServer: async (threadId: string, currentUsername: string, targetUsername: string) => {
    try {
      const res = await fetch(API_BASE + '/api/chat/direct/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername, targetUsername })
      });
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          messagesByChannel: {
            ...state.messagesByChannel,
            [threadId]: []
          }
        }));
      } else {
        console.error('Failed to clear direct messages (server error):', data.error);
      }
    } catch (e) {
      console.error('Failed to clear direct messages:', e);
    }
  },

  simulateIncomingMessage: async (recipientUsername: string, botName?: string, messageText?: string) => {
    if (!recipientUsername) return;
    const senderUsername = botName ? botName.toLowerCase().replace(/\s+/g, '_') : 'cyber_friend';
    const content = messageText || 'Привет! 👋 Это симулированное тестовое сообщение для проверки звука уведомления, аватарки на боковой панели и счетчика!';

    try {
      await fetch(API_BASE + '/api/chat/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUsername,
          recipientUsername,
          content,
          attachments: []
        })
      });

      // Instantly poll to trigger state updates & sounds
      await get().pollAllDirectMessages(recipientUsername, false);
    } catch (e) {
      console.error('Failed to simulate incoming message:', e);
    }
  },

  sendMessage: async (channelId, author, content, attachments = [], replyTo, recipientUsername) => {
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      channelId,
      author,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments,
      replyTo,
      reactions: []
    };

    // NOTE: Sound is ONLY played for INCOMING messages from other users per specification.
    // Sending our own message is silent.

    set((state) => {
      const currentList = state.messagesByChannel[channelId] || [];
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...currentList, newMessage]
        },
        replyingToMessage: null
      };
    });

    // Save to SQLite via Backend API
    try {
      if (recipientUsername) {
        // Direct Message to another real user
        await fetch(API_BASE + '/api/chat/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderUsername: author.username || author.id,
            recipientUsername,
            content,
            attachments,
            replyTo
          })
        });
      } else {
        // Channel Message
        await fetch(API_BASE + '/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId,
            author,
            content,
            attachments,
            replyTo
          })
        });
      }
    } catch (e) {
      console.warn('Failed to persist message to SQLite:', e);
    }
  },

  incrementUnreadCount: (channelId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [channelId]: (state.unreadCounts[channelId] || 0) + 1
      }
    }));
  },

  markAsRead: (channelId) => {
    set((state) => {
      const newCounts = { ...state.unreadCounts };
      delete newCounts[channelId];
      return { unreadCounts: newCounts };
    });
  },

  setActiveChatUser: (user) => {
    set((state) => {
      if (user) {
        // Automatically clear unread badge for this friend's direct message thread
        const currentUsername = useUserStore.getState().currentUser?.username;
        if (currentUsername && user.username) {
          const threadId = ['dm', currentUsername, user.username].sort().join('-');
          const newCounts = { ...state.unreadCounts };
          delete newCounts[threadId];
          return { activeChatUser: user, unreadCounts: newCounts };
        }
      }
      return { activeChatUser: user };
    });
  },

  toggleReaction: async (channelId, messageId, emoji, userId) => {
    set((state) => {
      const channelMessages = state.messagesByChannel[channelId] || [];
      const updatedMessages = channelMessages.map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = msg.reactions || [];
        const existingReactionIndex = reactions.findIndex((r) => r.emoji === emoji);

        if (existingReactionIndex > -1) {
          const reaction = reactions[existingReactionIndex];
          const hasUser = reaction.users.includes(userId);

          if (hasUser) {
            // Remove reaction
            const newUsers = reaction.users.filter((id) => id !== userId);
            if (newUsers.length === 0) {
              return {
                ...msg,
                reactions: reactions.filter((_, idx) => idx !== existingReactionIndex)
              };
            }
            const updatedReactions = [...reactions];
            updatedReactions[existingReactionIndex] = {
              ...reaction,
              count: reaction.count - 1,
              users: newUsers
            };
            return { ...msg, reactions: updatedReactions };
          } else {
            // Add user to existing emoji reaction
            const updatedReactions = [...reactions];
            updatedReactions[existingReactionIndex] = {
              ...reaction,
              count: reaction.count + 1,
              users: [...reaction.users, userId]
            };
            return { ...msg, reactions: updatedReactions };
          }
        } else {
          // New emoji reaction
          return {
            ...msg,
            reactions: [...reactions, { emoji, count: 1, users: [userId] }]
          };
        }
      });

      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: updatedMessages
        }
      };
    });

    try {
      await fetch(API_BASE + '/api/chat/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, messageId, emoji, userId })
      });
    } catch (e) {
      console.warn('Failed to save reaction on server:', e);
    }
  },

  togglePinMessage: (channelId, messageId) => {
    set((state) => {
      const channelMessages = state.messagesByChannel[channelId] || [];
      const updatedMessages = channelMessages.map((msg) =>
        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
      );
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: updatedMessages
        }
      };
    });
  },

  setReplyingToMessage: (message) => set({ replyingToMessage: message }),
  setPinnedFilterActive: (active) => set({ pinnedFilterActive: active })
}));
