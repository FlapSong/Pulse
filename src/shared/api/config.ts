const PRODUCTION_URL = 'https://ais-pre-givd4ljxuizrrqeaikvpo3-670756897843.europe-west2.run.app';
const DEV_URL = 'https://ais-dev-givd4ljxuizrrqeaikvpo3-670756897843.europe-west2.run.app';

export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const savedBase = localStorage.getItem('PULSE_API_BASE');
    if (savedBase) {
      if (window.location.protocol.startsWith('http')) {
        try {
          const url = new URL(savedBase);
          if (url.origin === window.location.origin) {
            return savedBase;
          } else {
            // Remove stale cross-origin API base to prevent network errors
            localStorage.removeItem('PULSE_API_BASE');
          }
        } catch {
          localStorage.removeItem('PULSE_API_BASE');
        }
      } else {
        return savedBase;
      }
    }

    // Detect if we are in Electron or a file protocol
    if (window.location.protocol === 'file:' || /electron/i.test(navigator.userAgent)) {
      return 'http://localhost:3000';
    }
  }
  return '';
};

export const API_BASE = getApiBase();

export const getDmThreadId = (user1?: string, user2?: string): string => {
  if (!user1 || !user2) return '';
  const clean1 = user1.toLowerCase().trim();
  const clean2 = user2.toLowerCase().trim();
  return ['dm', clean1, clean2].sort().join('-');
};
