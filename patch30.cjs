const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf8');

const target1 = `import { SoundNotification } from '../widgets/sound-notification/SoundNotification';`;
const replacement1 = `import { SoundNotification } from '../widgets/sound-notification/SoundNotification';\nimport { DevModeTransition } from '../widgets/dev-transition/DevModeTransition';`;

const target2 = `      <PerformanceOverlay />
    </div>
  );
}`;
const replacement2 = `      <PerformanceOverlay />
      <DevModeTransition />
    </div>
  );
}`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/app/App.tsx', code);
