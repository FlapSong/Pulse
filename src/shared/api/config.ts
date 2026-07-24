const PRODUCTION_URL = 'https://ais-pre-givd4ljxuizrrqeaikvpo3-670756897843.europe-west2.run.app';
const DEV_URL = 'https://ais-dev-givd4ljxuizrrqeaikvpo3-670756897843.europe-west2.run.app';

export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const savedBase = localStorage.getItem('PULSE_API_BASE');
    if (savedBase) return savedBase;

    // Detect if we are in Electron or a file protocol
    if (window.location.protocol === 'file:' || /electron/i.test(navigator.userAgent)) {
      // For local development in Electron, default to localhost
      // This avoids 403 Forbidden errors from the AI Studio auth bridge
      return 'http://localhost:3000';
    }
  }
  return '';
};

export const API_BASE = getApiBase();
