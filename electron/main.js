const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Allow loading local files for game icons if needed
        },
        frame: true, // We can make this false for custom titlebar later
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#ffffff',
            height: 40
        },
        backgroundColor: '#0f172a',
        icon: path.join(__dirname, '../public/icon.ico') // Assuming we'll add an icon
    });

    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);

    // Open DevTools in dev mode
    if (process.env.ELECTRON_START_URL) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

// --- IPC Handlers ---

// Launch a game/file
ipcMain.handle('launch-game', async (event, filePath) => {
    return new Promise((resolve, reject) => {
        // Use shell.openPath for better compatibility
        shell.openPath(filePath).then((error) => {
            if (error) {
                reject(error);
            } else {
                resolve('Launched');
            }
        });
    });
});

// Select a file
ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Executables', extensions: ['exe', 'lnk', 'url'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result.filePaths[0];
});

// Get User Data path (for storing library DB if we move away from localStorage)
ipcMain.handle('get-app-path', () => {
    return app.getPath('userData');
});

// Start Python Backend
let pythonProcess;

function startPythonServer() {
    let scriptPath;

    if (app.isPackaged) {
        // In production, the exe is in resources/extraResources
        scriptPath = path.join(process.resourcesPath, 'extraResources', 'GameManagerBackend.exe');
    } else {
        // In dev, it's in the dist folder created by pyinstaller
        scriptPath = path.join(__dirname, '../dist/GameManagerBackend.exe');
    }

    console.log("Starting backend from:", scriptPath);

    if (fs.existsSync(scriptPath)) {
        const { spawn } = require('child_process');
        pythonProcess = spawn(scriptPath);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Backend: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Backend Error: ${data}`);
        });
    } else {
        console.error("Backend executable not found at:", scriptPath);
        // Fallback for dev: run python script directly if exe not found
        if (!app.isPackaged) {
            console.log("Falling back to python script...");
            const { spawn } = require('child_process');
            pythonProcess = spawn('python', [path.join(__dirname, '../automation_server.py')]);
        }
    }
}

app.on('ready', () => {
    startPythonServer();
    createWindow();
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
