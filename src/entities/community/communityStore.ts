import { create } from 'zustand';
import { Community, Channel } from '../../shared/types';
import { INITIAL_COMMUNITIES } from '../../shared/config/initialData';

interface CommunityStore {
  communities: Community[];
  activeCommunityId: string | null; // null means Direct Messages / Friends
  activeChannelId: string;
  searchQuery: string;
  activeTab: 'home' | 'channels' | 'direct_messages' | 'discovery';
  
  setActiveCommunity: (communityId: string | null) => void;
  setActiveChannel: (channelId: string) => void;
  setActiveTab: (tab: 'home' | 'channels' | 'direct_messages' | 'discovery') => void;
  setSearchQuery: (query: string) => void;
  getActiveCommunity: () => Community | undefined;
  getActiveChannel: () => Channel | undefined;
}

export const useCommunityStore = create<CommunityStore>((set, get) => ({
  communities: INITIAL_COMMUNITIES,
  activeCommunityId: null,
  activeChannelId: 'ch-general',
  searchQuery: '',
  activeTab: 'home',

  setActiveCommunity: (communityId) => {
    if (communityId === null) {
      set({ activeCommunityId: null, activeTab: 'home' });
      return;
    }
    const targetCommunity = get().communities.find((c) => c.id === communityId);
    const firstChannelId = targetCommunity?.channels[0]?.id || '';
    set({
      activeCommunityId: communityId,
      activeChannelId: firstChannelId,
      activeTab: 'channels'
    });
  },

  setActiveChannel: (channelId) => set({ activeChannelId: channelId, activeTab: 'channels' }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  getActiveCommunity: () => {
    const { communities, activeCommunityId } = get();
    return communities.find((c) => c.id === activeCommunityId);
  },

  getActiveChannel: () => {
    const community = get().getActiveCommunity();
    const { activeChannelId } = get();
    return community?.channels.find((ch) => ch.id === activeChannelId);
  }
}));
