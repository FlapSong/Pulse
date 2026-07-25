const fs = require('fs');
let code = fs.readFileSync('src/widgets/settings-modal/SettingsModal.tsx', 'utf8');

const target1 = `    isDevMode,
    setDevMode
  } = useGameStore();`;
const replacement1 = `    isDevMode,
    setDevMode,
    setShowDevModeTransition
  } = useGameStore();`;

const target2 = `  const handleDevSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (devPassword === '0101') {
      setDevMode(true);
      setIsEnteringDevPass(false);
      setDevPassword('');
      setDevPasswordError(false);
    } else {`;
const replacement2 = `  const handleDevSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (devPassword === '0101') {
      setShowDevModeTransition(true);
      setIsEnteringDevPass(false);
      setDevPassword('');
      setDevPasswordError(false);
      setSettingsOpen(false); // close settings to show transition
    } else {`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/widgets/settings-modal/SettingsModal.tsx', code);
