import { create } from 'zustand';

interface PerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  pingMs: number;
  gpuUsagePercent: number;
  ramUsageGb: number;
}

interface GameStore {
  activeGameName: string;
  isGameRunning: boolean;
  isOverlayOpen: boolean; // Alt+U
  isOverlayEnabled: boolean;
  overlayHotkey: string;
  streamerModeActive: boolean;
  performanceMetrics: PerformanceMetrics;
  settingsOpen: boolean;
  activeSettingsTab: 'audio' | 'overlay' | 'hotkeys' | 'appearance' | 'streamer' | 'performance' | 'network';
  crosshairEnabled: boolean;
  fpsWidgetEnabled: boolean;

  setOverlayOpen: (open: boolean) => void;
  toggleOverlay: () => void;
  toggleOverlayEnabled: () => void;
  setStreamerMode: (active: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveSettingsTab: (tab: 'audio' | 'overlay' | 'hotkeys' | 'appearance' | 'streamer' | 'performance' | 'network') => void;
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  setActiveGameName: (name: string) => void;
  setCrosshairEnabled: (enabled: boolean) => void;
  setFpsWidgetEnabled: (enabled: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  activeGameName: 'Valorant',
  isGameRunning: true,
  isOverlayOpen: false,
  isOverlayEnabled: true,
  overlayHotkey: 'Alt + U',
  streamerModeActive: false,
  performanceMetrics: {
    fps: 240,
    frameTimeMs: 4.16,
    pingMs: 14,
    gpuUsagePercent: 42,
    ramUsageGb: 6.8
  },
  settingsOpen: false,
  activeSettingsTab: 'audio',
  crosshairEnabled: false,
  fpsWidgetEnabled: false,

  setOverlayOpen: (open) => set({ isOverlayOpen: open }),
  toggleOverlay: () => set((state) => ({ isOverlayOpen: !state.isOverlayOpen })),
  toggleOverlayEnabled: () => set((state) => ({ isOverlayEnabled: !state.isOverlayEnabled })),
  setStreamerMode: (active) => set({ streamerModeActive: active }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
  setActiveGameName: (name) => set({ activeGameName: name }),
  setCrosshairEnabled: (enabled) => set({ crosshairEnabled: enabled }),
  setFpsWidgetEnabled: (enabled) => set({ fpsWidgetEnabled: enabled }),

  updatePerformanceMetrics: (metrics) =>
    set((state) => ({
      performanceMetrics: { ...state.performanceMetrics, ...metrics }
    }))
}));
