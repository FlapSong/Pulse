import { create } from 'zustand';
import { Message, User } from '../../shared/types';
import { INITIAL_MESSAGES } from '../../shared/config/initialData';
import { soundService } from '../../shared/services/soundService';

interface ChatStore {
  messagesByChannel: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  activeChatUser: User | null;
  replyingToMessage: Message | null;
  pinnedFilterActive: boolean;

  sendMessage: (channelId: string, author: User, content: string, attachments?: any[], replyTo?: Message['replyTo']) => void;
  incrementUnreadCount: (channelId: string) => void;
  markAsRead: (channelId: string) => void;
  setActiveChatUser: (user: User | null) => void;
  toggleReaction: (channelId: string, messageId: string, emoji: string, userId: string) => void;
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

  sendMessage: (channelId, author, content, attachments = [], replyTo) => {
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

    // Play sleek custom UI message notification sound
    soundService.playMessage();

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

  setActiveChatUser: (user) => set({ activeChatUser: user }),

  toggleReaction: (channelId, messageId, emoji, userId) => {
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
