import { create } from 'zustand';
import { Message, User } from '../../shared/types';
import { INITIAL_MESSAGES } from '../../shared/config/initialData';
import { soundService } from '../../shared/services/soundService';
import { useUserStore } from '../user/userStore';
import { useGameStore } from '../game/gameStore';
import { API_BASE, getDmThreadId } from '../../shared/api/config';

const pendingReactions = new Map<string, number>();

function mergeReactions(messageId: string, serverReactions: any[] = [], localReactions: any[] = []): any[] {
  const emojiMap = new Map<string, { emoji: string; count: number; users: string[] }>();

  const isRecentlyToggled = (emoji: string) => {
    const key = `${messageId}-${emoji}`;
    const lastTime = pendingReactions.get(key) || 0;
    return Date.now() - lastTime < 3000;
  };

  serverReactions.forEach((sr: any) => {
    if (isRecentlyToggled(sr.emoji)) {
      return;
    }
    emojiMap.set(sr.emoji, {
      emoji: sr.emoji,
      count: sr.count,
      users: [...(sr.users || [])]
    });
  });

  localReactions.forEach((lr: any) => {
    if (isRecentlyToggled(lr.emoji)) {
      emojiMap.set(lr.emoji, {
        emoji: lr.emoji,
        count: lr.count,
        users: [...(lr.users || [])]
      });
    }
  });

  return Array.from(emojiMap.values()).filter(r => r.count > 0 && r.users.length > 0);
}

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
  deleteMessage: (channelId: string, messageId: string, userId: string) => Promise<void>;
  editMessage: (channelId: string, messageId: string, newContent: string, userId: string) => Promise<void>;
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
        set((state) => {
          const prevMsgs = state.messagesByChannel[channelId] || [];
          const merged = data.messages.map((nm: Message) => {
            const pm = prevMsgs.find((p) => p.id === nm.id);
            return {
              ...nm,
              reactions: mergeReactions(nm.id, nm.reactions, pm?.reactions)
            };
          });
          return {
            messagesByChannel: {
              ...state.messagesByChannel,
              [channelId]: merged
            }
          };
        });
      }
    } catch (e) {
      console.warn('Failed to fetch channel messages:', e);
    }
  },

  fetchDirectMessages: async (senderUsername: string, recipientUsername: string) => {
    if (!senderUsername || !recipientUsername) return;
    const threadId = getDmThreadId(senderUsername, recipientUsername);
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
          const merged = data.messages.map((nm: Message) => {
            const pm = prev.find((p) => p.id === nm.id);
            return {
              ...nm,
              reactions: mergeReactions(nm.id, nm.reactions, pm?.reactions)
            };
          });
          return {
            messagesByChannel: {
              ...state.messagesByChannel,
              [threadId]: merged
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

          const backendThreads = data.messagesByThread as Record<string, Message[]>;

          Object.entries(backendThreads).forEach(([rawThreadId, rawMsgs]) => {
            const threadId = rawThreadId.toLowerCase();
            const newMsgs = rawMsgs || [];
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
                  threadId.includes(activeDmUsername);

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

            // Update thread messages with server data while keeping local reactions and unsynced messages if any
            const mergedNewMsgs = newMsgs.map((nm) => {
              const prevMsg = prevMsgsArr.find((pm) => pm.id === nm.id);
              return {
                ...nm,
                reactions: mergeReactions(nm.id, nm.reactions, prevMsg?.reactions)
              };
            });

            if (prevMsgsArr.length > mergedNewMsgs.length) {
              const serverIds = new Set(mergedNewMsgs.map(m => m.id));
              const localUnsynced = prevMsgsArr.filter(m => !serverIds.has(m.id) && (m.id.startsWith('m-') || m.id.startsWith('dm-')));
              updatedMessagesByChannel[threadId] = [...mergedNewMsgs, ...localUnsynced];
            } else {
              updatedMessagesByChannel[threadId] = mergedNewMsgs;
            }
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
    if (!currentUsername || !targetUsername) return;
    const calcThreadId = getDmThreadId(currentUsername, targetUsername);
    const c1 = currentUsername.toLowerCase().trim();
    const c2 = targetUsername.toLowerCase().trim();

    // 1. Immediately purge from local Zustand state for instant UI update
    set((state) => {
      const updatedMessages = { ...state.messagesByChannel };
      const updatedUnread = { ...state.unreadCounts };

      Object.keys(updatedMessages).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (
          (lowerKey.includes(c1) && lowerKey.includes(c2)) ||
          key === threadId ||
          key === calcThreadId
        ) {
          updatedMessages[key] = [];
          delete updatedUnread[key];
        }
      });

      return {
        messagesByChannel: updatedMessages,
        unreadCounts: updatedUnread
      };
    });

    // 2. Call backend API to delete from SQLite and Firestore
    try {
      const res = await fetch('/api/chat/direct/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername, targetUsername })
      });
      const data = await res.json();
      if (!data.success) {
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
        await fetch('/api/chat/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newMessage.id,
            senderUsername: author.username || author.id,
            recipientUsername,
            content,
            attachments,
            replyTo
          })
        });
        if (author.username) {
          get().pollAllDirectMessages(author.username, true);
        }
      } else {
        // Channel Message
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newMessage.id,
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
          const threadId = getDmThreadId(currentUsername, user.username);
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
        const existingReaction = reactions.find((r) => r.emoji === emoji);
        const userHadThisEmoji = existingReaction?.users.includes(userId);

        // Remove user from all reactions on this message
        const cleanedReactions = reactions.map((r) => {
          if (r.users.includes(userId)) {
            const newUsers = r.users.filter((id) => id !== userId);
            return {
              ...r,
              count: newUsers.length,
              users: newUsers
            };
          }
          return r;
        }).filter((r) => r.count > 0);

        if (userHadThisEmoji) {
          // If they clicked the same reaction they already had, it toggles off (removes it)
          return { ...msg, reactions: cleanedReactions };
        } else {
          // Otherwise, add the new reaction
          const targetIndex = cleanedReactions.findIndex((r) => r.emoji === emoji);
          if (targetIndex > -1) {
            const r = cleanedReactions[targetIndex];
            const updated = [...cleanedReactions];
            updated[targetIndex] = {
              ...r,
              count: r.count + 1,
              users: [...r.users, userId]
            };
            return { ...msg, reactions: updated };
          } else {
            return {
              ...msg,
              reactions: [...cleanedReactions, { emoji, count: 1, users: [userId] }]
            };
          }
        }
      });

      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: updatedMessages
        }
      };
    });

    // Mark as pending to avoid race conditions with quick interval polling
    pendingReactions.set(`${messageId}-${emoji}`, Date.now());

    try {
      const res = await fetch(API_BASE + '/api/chat/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, messageId, emoji, userId })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.reactions)) {
        set((state) => {
          const channelMessages = state.messagesByChannel[channelId] || [];
          const updatedMessages = channelMessages.map((msg) =>
            msg.id === messageId ? { ...msg, reactions: data.reactions } : msg
          );
          return {
            messagesByChannel: {
              ...state.messagesByChannel,
              [channelId]: updatedMessages
            }
          };
        });
      }
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

  deleteMessage: async (channelId, messageId, userId) => {
    set((state) => {
      const channelMessages = state.messagesByChannel[channelId] || [];
      const updatedMessages = channelMessages.filter((msg) => msg.id !== messageId);
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: updatedMessages
        }
      };
    });

    try {
      const res = await fetch(API_BASE + '/api/chat/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, messageId, userId })
      });
      const data = await res.json();
      if (!data.success) {
        console.warn('Failed to delete message on server:', data.error);
      }
    } catch (e) {
      console.warn('Failed to delete message on server:', e);
    }
  },

  editMessage: async (channelId, messageId, newContent, userId) => {
    set((state) => {
      const channelMessages = state.messagesByChannel[channelId] || [];
      const updatedMessages = channelMessages.map((msg) => {
        if (msg.id === messageId) {
          return { ...msg, content: newContent };
        }
        return msg;
      });
      return {
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: updatedMessages
        }
      };
    });

    try {
      const res = await fetch(API_BASE + '/api/chat/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, messageId, newContent, userId })
      });
      const data = await res.json();
      if (!data.success) {
        console.warn('Failed to edit message on server:', data.error);
      }
    } catch (e) {
      console.warn('Failed to edit message on server:', e);
    }
  },

  setReplyingToMessage: (message) => set({ replyingToMessage: message }),
  setPinnedFilterActive: (active) => set({ pinnedFilterActive: active })
}));
