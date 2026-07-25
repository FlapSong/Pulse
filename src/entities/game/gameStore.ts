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
  performanceMetrics: PerformanceMetrics;
  settingsOpen: boolean;
  activeSettingsTab: 'audio' | 'hotkeys' | 'appearance' | 'performance' | 'network';
  crosshairEnabled: boolean;
  fpsWidgetEnabled: boolean;
  isDevMode: boolean;
  showDevModeTransition: boolean;

  setSettingsOpen: (open: boolean) => void;
  setActiveSettingsTab: (tab: 'audio' | 'hotkeys' | 'appearance' | 'performance' | 'network') => void;
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  setActiveGameName: (name: string) => void;
  setCrosshairEnabled: (enabled: boolean) => void;
  setFpsWidgetEnabled: (enabled: boolean) => void;
  setDevMode: (enabled: boolean) => void;
  setShowDevModeTransition: (show: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  activeGameName: 'Valorant',
  isGameRunning: true,
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
  isDevMode: typeof window !== 'undefined' ? (localStorage.getItem('PULSE_DEV_MODE') === 'true' && (import.meta as any).env.MODE !== 'production') : false,
  showDevModeTransition: false,

  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
  setActiveGameName: (name) => set({ activeGameName: name }),
  setCrosshairEnabled: (enabled) => set({ crosshairEnabled: enabled }),
  setFpsWidgetEnabled: (enabled) => set({ fpsWidgetEnabled: enabled }),
  setDevMode: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('PULSE_DEV_MODE', String(enabled));
    }
    set({ isDevMode: enabled });
  },
  setShowDevModeTransition: (show) => set({ showDevModeTransition: show }),

  updatePerformanceMetrics: (metrics) =>
    set((state) => ({
      performanceMetrics: { ...state.performanceMetrics, ...metrics }
    }))
}));
