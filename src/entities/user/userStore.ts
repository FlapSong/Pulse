import { create } from 'zustand';
import { User, UserStatus, GameActivity } from '../../shared/types';
import { CURRENT_USER } from '../../shared/config/initialData';
import { soundService } from '../../shared/services/soundService';
import { API_BASE } from '../../shared/api/config';
import { useGameStore } from '../game/gameStore';

export interface SavedAccount {
  id: string;
  login: string;
  displayName: string;
  password?: string;
  email?: string;
  avatar: string;
  role: string;
  badge: string;
  isVerified?: boolean;
  createdAt: number;
}

export interface PulseEmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  code?: string;
  type: 'verification' | 'login_alert';
  createdAt: number;
  read: boolean;
}

const ACCOUNTS_STORAGE_KEY = 'pulse_saved_accounts_v2';
const ACTIVE_USER_STORAGE_KEY = 'pulse_active_user_v2';
const REMEMBER_ME_STORAGE_KEY = 'pulse_remember_me_v2';

const DEFAULT_ACCOUNT: SavedAccount = {
  id: CURRENT_USER.id,
  login: CURRENT_USER.username,
  displayName: CURRENT_USER.displayName,
  password: '123',
  email: 'phantom@pulse.gg',
  avatar: CURRENT_USER.avatar,
  role: CURRENT_USER.role || 'Pro Member',
  badge: CURRENT_USER.badge || 'CYAN SQUAD',
  isVerified: true,
  createdAt: Date.now()
};

function getStoredAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([DEFAULT_ACCOUNT]));
      return [DEFAULT_ACCOUNT];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_ACCOUNT];
  } catch (e) {
    return [DEFAULT_ACCOUNT];
  }
}

function saveAccountsToStorage(accounts: SavedAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts to localStorage', e);
  }
}

function getInitialAuthState(): { activeUser: User; isAuthenticated: boolean } {
  const accounts = getStoredAccounts();
  try {
    const rememberMe = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);

    if (rememberMe === 'false') {
      return { activeUser: CURRENT_USER, isAuthenticated: false };
    }

    if (activeId) {
      const found = accounts.find((a) => a.id === activeId);
      if (found) {
        return {
          activeUser: {
            id: found.id,
            username: found.login,
            displayName: found.displayName,
            avatar: found.avatar,
            status: 'online',
            customStatus: '⚡ В сети в Pulse',
            role: found.role,
            badge: found.badge
          },
          isAuthenticated: true
        };
      }
    }
  } catch (e) {
    // fallback
  }

  // Default initial auth state based on stored active user
  const activeId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
  return {
    activeUser: CURRENT_USER,
    isAuthenticated: !!activeId
  };
}

interface UserStore {
  currentUser: User;
  isAuthenticated: boolean;
  authModalOpen: boolean;
  authMode: 'login' | 'register';
  accounts: SavedAccount[];
  
  // Friends & Requests State
  friends: User[];
  incomingRequests: User[];
  outgoingRequests: User[];
  blockedLogins: string[];
  blockedByLogins: string[];
  searchResults: (User & { relationship: 'friend' | 'pending_incoming' | 'pending_outgoing' | 'blocked' | 'none' })[];

  // Verification Flow State
  pendingVerification: {
    login: string;
    email: string;
    demoCode?: string;
    devCode?: string;
    realSent?: boolean;
    isConfigured?: boolean;
    smtpError?: string;
  } | null;

  // Virtual Inbox, Notifications & Profile Customization
  inboxModalOpen: boolean;
  notificationsModalOpen: boolean;
  profileModalOpen: boolean;
  userInbox: PulseEmailNotification[];
  muteHotkey: string;
  muteMicHotkey: string;
  deafenHotkey: string;

  setStatus: (status: UserStatus) => void;
  setCustomStatus: (status: string) => void;
  setGameActivity: (activity: GameActivity | undefined) => void;
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'register') => void;
  setInboxModalOpen: (open: boolean) => void;
  setNotificationsModalOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
  setMuteHotkey: (key: string) => void;
  setMuteMicHotkey: (key: string) => void;
  setDeafenHotkey: (key: string) => void;

  // Friends & Status Server API Methods
  updateUserStatusServer: (status: UserStatus, customStatus?: string) => Promise<void>;
  fetchFriendsServer: () => Promise<void>;
  searchUsersServer: (query: string) => Promise<void>;
  sendFriendRequestServer: (targetLogin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  acceptFriendRequestServer: (targetLogin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  declineFriendRequestServer: (targetLogin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  removeFriendServer: (targetLogin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  simulateFriendRequestServer: () => Promise<{ success: boolean; message?: string; error?: string }>;
  blockUserServer: (targetLogin: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  unblockUserServer: (targetLogin: string) => Promise<{ success: boolean; message?: string; error?: string }>;

  // Server API Methods
  registerAccountServer: (
    loginStr: string,
    displayNameStr: string,
    passStr: string,
    emailStr: string
  ) => Promise<{
    success: boolean;
    requireVerification?: boolean;
    email?: string;
    login?: string;
    demoCode?: string;
    devCode?: string;
    realSent?: boolean;
    isConfigured?: boolean;
    smtpError?: string;
    error?: string;
  }>;

  verifyCodeServer: (
    loginStr: string,
    codeStr: string
  ) => Promise<{ success: boolean; error?: string }>;

  resendCodeServer: (
    loginStr: string
  ) => Promise<{
    success: boolean;
    message?: string;
    email?: string;
    login?: string;
    devCode?: string;
    realSent?: boolean;
    isConfigured?: boolean;
    smtpError?: string;
    error?: string;
  }>;

  loginAccountServer: (
    loginStr: string,
    passStr: string
  ) => Promise<{
    success: boolean;
    requireVerification?: boolean;
    email?: string;
    login?: string;
    demoCode?: string;
    devCode?: string;
    realSent?: boolean;
    isConfigured?: boolean;
    smtpError?: string;
    message?: string;
    error?: string;
  }>;

  resetPasswordRequestServer: (
    loginOrEmail: string
  ) => Promise<{
    success: boolean;
    email?: string;
    login?: string;
    demoCode?: string;
    devCode?: string;
    realSent?: boolean;
    isConfigured?: boolean;
    smtpError?: string;
    error?: string;
  }>;

  resetPasswordConfirmServer: (
    login: string,
    code: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;

  updateProfileServer: (
    profileData: { displayName?: string; avatar?: string; customStatus?: string; role?: string; badge?: string }
  ) => Promise<{ success: boolean; error?: string }>;

  fetchUserInbox: (targetEmail?: string) => Promise<void>;
  switchAccount: (accountId: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set, get) => {
  const initialAccounts = getStoredAccounts();
  const { activeUser, isAuthenticated } = getInitialAuthState();

  return {
    currentUser: activeUser,
    isAuthenticated,
    authModalOpen: false,
    authMode: 'login',
    accounts: initialAccounts,
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    blockedLogins: [],
    blockedByLogins: [],
    searchResults: [],
    pendingVerification: null,
    inboxModalOpen: false,
    notificationsModalOpen: false,
    profileModalOpen: false,
    userInbox: [],
    muteHotkey: 'ALT+M',
    muteMicHotkey: 'ALT+M',
    deafenHotkey: 'ALT+D',

    setStatus: (status) => {
      set((state) => ({
        currentUser: { ...state.currentUser, status }
      }));
      get().updateUserStatusServer(status);
      soundService.setUserStatus(status, get().currentUser?.customStatus || '');
    },

    setCustomStatus: (customStatus) => {
      set((state) => ({
        currentUser: { ...state.currentUser, customStatus }
      }));
      get().updateUserStatusServer(get().currentUser.status, customStatus);
      soundService.setUserStatus(get().currentUser.status, customStatus);
    },

    setMuteHotkey: (muteHotkey) => {
      set({ muteHotkey });
    },

    setMuteMicHotkey: (muteMicHotkey) => {
      set({ muteMicHotkey });
    },

    setDeafenHotkey: (deafenHotkey) => {
      set({ deafenHotkey });
    },

    updateUserStatusServer: async (status, customStatus) => {
      const { currentUser } = get();
      if (!currentUser.username) return;

      try {
        const res = await fetch(API_BASE + '/api/user/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: currentUser.username,
            status,
            customStatus: customStatus !== undefined ? customStatus : currentUser.customStatus
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          set((state) => ({
            currentUser: {
              ...state.currentUser,
              status: data.user.status,
              customStatus: data.user.customStatus
            }
          }));
          soundService.setUserStatus(data.user.status, data.user.customStatus || '');
        }
      } catch (e) {
        // silent fail
      }
    },

    fetchFriendsServer: async () => {
      const { currentUser, incomingRequests: prevIncoming } = get();
      if (!currentUser.username) return;

      try {
        const res = await fetch(API_BASE + `/api/friends/${encodeURIComponent(currentUser.username)}`);
        const data = await res.json();
        if (data.success) {
          let nextIncoming = data.incomingRequests || [];
          let fetchedFriends = data.friends || [];
          
          const isDev = useGameStore.getState().isDevMode;
          const TEST_LOGINS = ['phantom', 'cyber_friend', 'pro_gamer_777', 'speed_demon', 'shadow_ninja', 'aim_master', 'neon_pulse'];
          
          if (!isDev) {
            nextIncoming = nextIncoming.filter((req: any) => !TEST_LOGINS.includes((req.senderLogin || '').toLowerCase()));
            fetchedFriends = fetchedFriends.filter((f: any) => !TEST_LOGINS.includes((f.username || '').toLowerCase()));
          }

          if (nextIncoming.length > prevIncoming.length) {
            soundService.playMessage();
          }


          set({
            friends: fetchedFriends,
            incomingRequests: nextIncoming,
            outgoingRequests: data.outgoingRequests || [],
            blockedLogins: data.blockedLogins || [],
            blockedByLogins: data.blockedByLogins || []
          });
        }
      } catch (e) {
        // silent fail
      }
    },

    searchUsersServer: async (query: string) => {
      const { currentUser } = get();
      try {
        const res = await fetch(
          API_BASE + `/api/users/search?q=${encodeURIComponent(query)}&currentLogin=${encodeURIComponent(
            currentUser.username || ''
          )}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          let users = data.users;
          const isDev = useGameStore.getState().isDevMode;
          const TEST_LOGINS = ['phantom', 'cyber_friend', 'pro_gamer_777', 'speed_demon', 'shadow_ninja', 'aim_master', 'neon_pulse'];
          if (!isDev) {
            users = users.filter((u: any) => !TEST_LOGINS.includes((u.username || '').toLowerCase()));
          }
          set({ searchResults: users });
        }
      } catch (e) {
        set({ searchResults: [] });
      }
    },

    sendFriendRequestServer: async (targetLogin: string) => {
      const { currentUser } = get();
      try {
        const res = await fetch(API_BASE + '/api/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLogin: currentUser.username,
            targetLogin
          })
        });
        const data = await res.json();
        if (data.success) {
          get().fetchFriendsServer();
          if (currentUser.username) {
            get().searchUsersServer('');
          }
          return { success: true, message: data.message };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: ' Ошибка сети' };
      }
    },

    acceptFriendRequestServer: async (targetLogin: string) => {
      const { currentUser } = get();
      try {
        const res = await fetch(API_BASE + '/api/friends/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLogin: currentUser.username,
            targetLogin
          })
        });
        const data = await res.json();
        if (data.success) {
          get().fetchFriendsServer();
          return { success: true, message: data.message };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка сети' };
      }
    },

    declineFriendRequestServer: async (targetLogin: string) => {
      const { currentUser } = get();
      try {
        const res = await fetch(API_BASE + '/api/friends/decline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLogin: currentUser.username,
            targetLogin
          })
        });
        const data = await res.json();
        if (data.success) {
          get().fetchFriendsServer();
          return { success: true, message: data.message };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка сети' };
      }
    },

    removeFriendServer: async (targetLogin: string) => {
      const { currentUser } = get();
      try {
        const res = await fetch(API_BASE + '/api/friends/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLogin: currentUser.username,
            targetLogin
          })
        });
        const data = await res.json();
        if (data.success) {
          get().fetchFriendsServer();
          return { success: true, message: data.message };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка сети' };
      }
    },

    simulateFriendRequestServer: async () => {
      const { currentUser } = get();
      if (!currentUser.username) {
        return { success: false, error: 'Вы не авторизованы' };
      }
      try {
        const res = await fetch(API_BASE + '/api/friends/simulate-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLogin: currentUser.username
          })
        });
        const data = await res.json();
        if (data.success) {
          get().fetchFriendsServer();
          soundService.playMessage();
          return { success: true, message: data.message };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка сети' };
      }
    },

    blockUserServer: async (targetLogin: string) => {
      const { currentUser } = get();
      try {
        const res = await fetch(API_BASE + '/api/friends/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentLogin: currentUser.username, targetLogin })
        });
        const data = await res.json();
        if (data.success) {
          set((state) => ({
            blockedLogins: [...state.blockedLogins, targetLogin],
            friends: state.friends.filter(f => f.username !== targetLogin)
          }));
          get().fetchFriendsServer();
          return { success: true, message: data.message || 'Пользователь заблокирован' };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка при блокировке' };
      }
    },

    unblockUserServer: async (targetLogin: string) => {
      const { currentUser } = get();
      try {
        const res = await fetch(API_BASE + '/api/friends/unblock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentLogin: currentUser.username, targetLogin })
        });
        const data = await res.json();
        if (data.success) {
          set((state) => ({
            blockedLogins: state.blockedLogins.filter(l => l !== targetLogin)
          }));
          return { success: true, message: data.message || 'Пользователь разблокирован' };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка при разблокировке' };
      }
    },

    setGameActivity: (gameActivity) =>
      set((state) => ({
        currentUser: { ...state.currentUser, gameActivity }
      })),

    setAuthModalOpen: (open, mode = 'login') =>
      set({ authModalOpen: open, authMode: mode }),

    setInboxModalOpen: (open) => {
      set({ inboxModalOpen: open });
      if (open) {
        get().fetchUserInbox();
      }
    },

    setNotificationsModalOpen: (open) => set({ notificationsModalOpen: open }),

    setProfileModalOpen: (open) => set({ profileModalOpen: open }),

    // 1. REGISTER ACCOUNT ON SERVER
    registerAccountServer: async (loginStr, displayNameStr, passStr, emailStr) => {
      try {
        const response = await fetch(API_BASE + '/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: loginStr,
            displayName: displayNameStr,
            password: passStr,
            email: emailStr
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Ошибка при регистрации' };
        }

        if (data.user) {
          const serverUser = data.user;
          const activeUser: User = {
            id: serverUser.id,
            username: serverUser.username,
            displayName: serverUser.displayName,
            avatar: serverUser.avatar,
            status: 'online',
            customStatus: '⚡ В сети в Pulse',
            role: serverUser.role,
            badge: serverUser.badge
          };

          const newAccountRecord: SavedAccount = {
            id: serverUser.id,
            login: serverUser.username,
            displayName: serverUser.displayName,
            email: serverUser.email,
            avatar: serverUser.avatar,
            role: serverUser.role,
            badge: serverUser.badge,
            isVerified: true,
            createdAt: Date.now()
          };

          const currentAccounts = get().accounts.filter((a) => a.id !== newAccountRecord.id);
          const updatedAccounts = [newAccountRecord, ...currentAccounts];
          saveAccountsToStorage(updatedAccounts);

          try {
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, serverUser.id);
          } catch (e) {}

          set({
            accounts: updatedAccounts,
            currentUser: activeUser,
            isAuthenticated: true,
            authModalOpen: false,
            pendingVerification: null
          });

          setTimeout(() => get().fetchUserInbox(), 500);

          return { success: true };
        }

        return { success: false, error: 'Не удалось получить данные аккаунта' };
      } catch (err: any) {
        return { success: false, error: 'Ошибка соединения с сервером Pulse' };
      }
    },

    // 2. VERIFY 6-DIGIT CODE ON SERVER
    verifyCodeServer: async (loginStr, codeStr) => {
      try {
        const response = await fetch(API_BASE + '/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: loginStr,
            code: codeStr
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Неверный код' };
        }

        const serverUser = data.user;
        const activeUser: User = {
          id: serverUser.id,
          username: serverUser.username,
          displayName: serverUser.displayName,
          avatar: serverUser.avatar,
          status: 'online',
          customStatus: '⚡ В сети в Pulse',
          role: serverUser.role,
          badge: serverUser.badge
        };

        const newAccountRecord: SavedAccount = {
          id: serverUser.id,
          login: serverUser.username,
          displayName: serverUser.displayName,
          email: serverUser.email,
          avatar: serverUser.avatar,
          role: serverUser.role,
          badge: serverUser.badge,
          isVerified: true,
          createdAt: Date.now()
        };

        const currentAccounts = get().accounts.filter((a) => a.id !== newAccountRecord.id);
        const updatedAccounts = [newAccountRecord, ...currentAccounts];
        saveAccountsToStorage(updatedAccounts);

        try {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, serverUser.id);
        } catch (e) {}

        set({
          accounts: updatedAccounts,
          currentUser: activeUser,
          isAuthenticated: true,
          authModalOpen: false,
          pendingVerification: null
        });

        // Refresh user inbox
        setTimeout(() => get().fetchUserInbox(), 500);

        return { success: true };
      } catch (err: any) {
        return { success: false, error: 'Ошибка верификации на сервере' };
      }
    },

    // 2.5 RESEND CODE ON SERVER
    resendCodeServer: async (loginStr) => {
      try {
        const response = await fetch(API_BASE + '/api/auth/resend-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: loginStr })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Ошибка при запросе кода' };
        }

        set({
          pendingVerification: {
            login: data.login,
            email: data.email,
            demoCode: data.demoCode,
            devCode: data.devCode,
            realSent: data.realSent,
            isConfigured: data.isConfigured,
            smtpError: data.smtpError
          }
        });

        return {
          success: true,
          message: data.message,
          email: data.email,
          login: data.login,
          devCode: data.devCode,
          realSent: data.realSent,
          isConfigured: data.isConfigured,
          smtpError: data.smtpError
        };
      } catch (err: any) {
        return { success: false, error: 'Ошибка сети при повторной отправке' };
      }
    },

    // 3. LOGIN ACCOUNT ON SERVER
    loginAccountServer: async (loginStr, passStr) => {
      try {
        const response = await fetch(API_BASE + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: loginStr,
            password: passStr
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Ошибка входа' };
        }

        const serverUser = data.user;
        const activeUser: User = {
          id: serverUser.id,
          username: serverUser.username,
          displayName: serverUser.displayName,
          avatar: serverUser.avatar,
          status: 'online',
          customStatus: '⚡ В сети в Pulse',
          role: serverUser.role,
          badge: serverUser.badge
        };

        const newAccountRecord: SavedAccount = {
          id: serverUser.id,
          login: serverUser.username,
          displayName: serverUser.displayName,
          email: serverUser.email,
          avatar: serverUser.avatar,
          role: serverUser.role,
          badge: serverUser.badge,
          isVerified: true,
          createdAt: Date.now()
        };

        const currentAccounts = get().accounts.filter((a) => a.id !== newAccountRecord.id);
        const updatedAccounts = [newAccountRecord, ...currentAccounts];
        saveAccountsToStorage(updatedAccounts);

        try {
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, serverUser.id);
        } catch (e) {}

        set({
          accounts: updatedAccounts,
          currentUser: activeUser,
          isAuthenticated: true,
          authModalOpen: false,
          pendingVerification: null
        });

        // Refresh user inbox
        setTimeout(() => get().fetchUserInbox(), 500);

        return { success: true };
      } catch (err: any) {
        return { success: false, error: 'Ошибка соединения с сервером Pulse' };
      }
    },

    // 4. REQUEST PASSWORD RESET
    resetPasswordRequestServer: async (loginOrEmail) => {
      try {
        const response = await fetch(API_BASE + '/api/auth/reset-password-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginOrEmail })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Не удалось запросить сброс пароля' };
        }
        return {
          success: true,
          email: data.email,
          login: data.login,
          demoCode: data.demoCode,
          devCode: data.devCode,
          realSent: data.realSent,
          isConfigured: data.isConfigured,
          smtpError: data.smtpError
        };
      } catch (e) {
        return { success: false, error: 'Ошибка сети при запросе сброса пароля' };
      }
    },

    // 5. CONFIRM PASSWORD RESET
    resetPasswordConfirmServer: async (login, code, newPassword) => {
      try {
        const response = await fetch(API_BASE + '/api/auth/reset-password-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, code, newPassword })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Неверный код или ошибка' };
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: 'Ошибка при сохранении нового пароля' };
      }
    },

    // 6. UPDATE USER PROFILE
    updateProfileServer: async (profileData) => {
      const { currentUser, accounts } = get();
      if (!currentUser.id) return { success: false, error: 'Нет активного пользователя' };

      try {
        const response = await fetch(API_BASE + '/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            username: currentUser.username,
            displayName: profileData.displayName,
            avatar: profileData.avatar,
            role: profileData.role,
            badge: profileData.badge
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          return { success: false, error: data.error || 'Ошибка при обновлении профиля' };
        }

        const serverUser = data.user;
        const updatedUser: User = {
          ...currentUser,
          displayName: serverUser.displayName || currentUser.displayName,
          avatar: serverUser.avatar || currentUser.avatar,
          customStatus: profileData.customStatus !== undefined ? profileData.customStatus : currentUser.customStatus,
          role: serverUser.role || currentUser.role,
          badge: serverUser.badge || currentUser.badge
        };

        const updatedAccounts = accounts.map((acc) => {
          if (acc.id === currentUser.id) {
            return {
              ...acc,
              displayName: updatedUser.displayName,
              avatar: updatedUser.avatar,
              role: updatedUser.role || acc.role,
              badge: updatedUser.badge || acc.badge
            };
          }
          return acc;
        });

        saveAccountsToStorage(updatedAccounts);

        set({
          currentUser: updatedUser,
          accounts: updatedAccounts
        });

        return { success: true };
      } catch (e) {
        return { success: false, error: 'Ошибка сети при обновлении профиля' };
      }
    },

    // 7. FETCH USER INBOX
    fetchUserInbox: async (targetEmail?: string) => {
      const { currentUser, pendingVerification } = get();
      const emailToFetch =
        targetEmail ||
        currentUser.email ||
        pendingVerification?.email ||
        (currentUser.username ? `${currentUser.username}@pulse.gg` : '');

      if (!emailToFetch) return;

      try {
        const res = await fetch(API_BASE + `/api/auth/inbox/${encodeURIComponent(emailToFetch)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.emails)) {
          set({ userInbox: data.emails });
        }
      } catch (e) {
        // ignore
      }
    },

    switchAccount: (accountId) => {
      const { accounts } = get();
      const target = accounts.find((a) => a.id === accountId);
      if (!target) return;

      const user: User = {
        id: target.id,
        username: target.login,
        displayName: target.displayName,
        avatar: target.avatar,
        status: 'online',
        customStatus: '⚡ В сети в Pulse',
        role: target.role,
        badge: target.badge
      };

      try {
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, target.id);
      } catch (e) {}

      set({
        currentUser: user,
        isAuthenticated: true,
        authModalOpen: false
      });
      get().fetchUserInbox();
    },

    loginAsGuest: async () => {
      const guestNum = Math.floor(1000 + Math.random() * 9000);
      let guestUser: User = {
        id: `u-guest-${guestNum}`,
        username: `guest_${guestNum}`,
        displayName: `Гость #${guestNum}`,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        status: 'online',
        customStatus: '⚡ Временный гость в Pulse',
        role: 'Временный аккаунт',
        badge: 'GUEST'
      };

      try {
        const res = await fetch(API_BASE + '/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestNum })
        });
        const data = await res.json();
        if (data.success && data.user) {
          guestUser = {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.displayName,
            avatar: data.user.avatar,
            status: data.user.status || 'online',
            customStatus: data.user.customStatus || '⚡ Временный гость в Pulse',
            role: data.user.role || 'Временный аккаунт',
            badge: data.user.badge || 'GUEST'
          };
        }
      } catch (e) {
        console.error('Guest server register error', e);
      }

      const guestAccountRecord: SavedAccount = {
        id: guestUser.id,
        login: guestUser.username,
        displayName: guestUser.displayName,
        email: `${guestUser.username}@pulse.gg`,
        avatar: guestUser.avatar,
        role: guestUser.role,
        badge: guestUser.badge,
        isVerified: true,
        createdAt: Date.now()
      };

      const currentAccounts = get().accounts.filter((a) => a.id !== guestAccountRecord.id);
      const updatedAccounts = [guestAccountRecord, ...currentAccounts];
      saveAccountsToStorage(updatedAccounts);

      try {
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, guestUser.id);
        localStorage.setItem(REMEMBER_ME_STORAGE_KEY, 'true');
      } catch (e) {}

      set({
        accounts: updatedAccounts,
        currentUser: guestUser,
        isAuthenticated: true,
        authModalOpen: false,
        pendingVerification: null
      });

      get().fetchFriendsServer();
    },

    logout: () => {
      try {
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      } catch (e) {}

      set({
        isAuthenticated: false,
        authModalOpen: true,
        authMode: 'login',
        pendingVerification: null
      });
    }
  };
});

// Sync initial user status to soundService
const initialUser = useUserStore.getState()?.currentUser;
if (initialUser) {
  soundService.setUserStatus(initialUser.status, initialUser.customStatus || '');
}

// Subscribe to future state updates
if (typeof window !== 'undefined') {
  useUserStore.subscribe((state) => {
    if (state.currentUser) {
      soundService.setUserStatus(state.currentUser.status, state.currentUser.customStatus || '');
    }
  });
}
