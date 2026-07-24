const { app, BrowserWindow } = require('electron');
const path = require('path');

// Start the background server in production
if (app.isPackaged) {
  process.env.NODE_ENV = 'production';
  try {
    // We require the bundled server. esbuild will have bundled everything into this file.
    require(path.join(__dirname, '../dist/server.cjs'));
  } catch (err) {
    console.error('Failed to start Pulse background server:', err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    backgroundColor: '#0a0a0c',
    titleBarStyle: 'hiddenInset'
  });

  const isDev = !app.isPackaged;
  console.log(`Starting Electron. isDev: ${isDev}`);

  // Handle load failure
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load: ${validatedURL} (Error ${errorCode}: ${errorDescription})`);
    if (isDev && (errorCode === -102 || errorCode === -105)) { // Connection refused or name not resolved
      console.log('Server not ready, retrying in 2s...');
      setTimeout(() => {
        if (!win.isDestroyed()) win.loadURL('http://localhost:3000');
      }, 2000);
    }
  });

  win.webContents.on('did-finish-load', () => {
    console.log('Main window finished loading content');
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    // Open devtools by default in dev to help debug black screen
    win.webContents.openDevTools();
  } else {
    // In production, we load from the dist folder
    // Using absolute path for more reliability
    const indexPath = path.resolve(__dirname, '../dist/index.html');
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load local index.html:', err);
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
