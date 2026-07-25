const fs = require('fs');
let code = fs.readFileSync('src/entities/game/gameStore.ts', 'utf8');

const target1 = `  isDevMode: boolean;`;
const replacement1 = `  isDevMode: boolean;\n  showDevModeTransition: boolean;`;

const target2 = `  setDevMode: (enabled: boolean) => void;`;
const replacement2 = `  setDevMode: (enabled: boolean) => void;\n  setShowDevModeTransition: (show: boolean) => void;`;

const target3 = `  isDevMode: typeof window !== 'undefined' ? localStorage.getItem('PULSE_DEV_MODE') === 'true' : false,`;
const replacement3 = `  isDevMode: typeof window !== 'undefined' ? localStorage.getItem('PULSE_DEV_MODE') === 'true' : false,\n  showDevModeTransition: false,`;

const target4 = `  setDevMode: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('PULSE_DEV_MODE', String(enabled));
    }
    set({ isDevMode: enabled });
  },`;
const replacement4 = `  setDevMode: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('PULSE_DEV_MODE', String(enabled));
    }
    set({ isDevMode: enabled });
  },\n  setShowDevModeTransition: (show) => set({ showDevModeTransition: show }),`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);
code = code.replace(target4, replacement4);

fs.writeFileSync('src/entities/game/gameStore.ts', code);
