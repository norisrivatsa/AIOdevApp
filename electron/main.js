const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let backendProcess;

// Determine if running in development or production
const isDev = !app.isPackaged;

// Paths
const backendPath = isDev
  ? path.join(__dirname, '..', 'backend')
  : path.join(process.resourcesPath, 'backend');

const frontendPath = isDev
  ? 'http://localhost:5173'  // Vite dev server
  : `file://${path.join(__dirname, '..', 'frontend', 'dist', 'index.html')}`;

function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server...');

    // In production, use the bundled Python
    // In development, use the venv Python
    const pythonCmd = isDev
      ? path.join(backendPath, 'venv', 'bin', 'python3')
      : 'python3';  // Adjust for Windows: 'python' or 'python.exe'

    const uvicornArgs = [
      '-m', 'uvicorn',
      'app.main:app',
      '--host', '127.0.0.1',
      '--port', '8000'
    ];

    backendProcess = spawn(pythonCmd, uvicornArgs, {
      cwd: backendPath,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1'
      }
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
      if (data.toString().includes('Uvicorn running')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    // Resolve after 3 seconds even if we don't see the message
    setTimeout(resolve, 3000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'), // Add your icon here
  });

  // Load the frontend
  mainWindow.loadURL(frontendPath);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // Start backend first
    await startBackend();
    console.log('Backend started successfully');

    // Then create the window
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  // Kill backend process when app quits
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
  }
});

// Handle process termination
process.on('SIGINT', () => {
  app.quit();
});

process.on('SIGTERM', () => {
  app.quit();
});
