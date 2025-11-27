const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
        },
        frame: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#ffffff',
            height: 40
        },
        backgroundColor: '#0f172a',
        icon: path.join(__dirname, '../Program İco/ico/icon128_1.ico')
    });

    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);

    if (process.env.ELECTRON_START_URL) {
        mainWindow.webContents.openDevTools();
    }

ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) {
        return { status: 'dev', message: 'Updates are only available in the installed app.' };
    }

    try {
        await autoUpdater.checkForUpdatesAndNotify();
        return { status: 'ok', message: 'Update check started. You will be notified if an update is available.' };
    } catch (e) {
        return { status: 'error', message: e?.message || 'Failed to check for updates.' };
    }
});

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

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

let pythonProcess;

function startPythonServer() {
    let scriptPath;

    if (app.isPackaged) {
        scriptPath = path.join(process.resourcesPath, 'extraResources', 'GameManagerBackend.exe');
    } else {
        scriptPath = path.join(__dirname, '../dist/GameManagerBackend.exe');
    }

    console.log('Starting backend from:', scriptPath);

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
        console.error('Backend executable not found at:', scriptPath);
        if (!app.isPackaged) {
            console.log('Falling back to python script...');
            const { spawn } = require('child_process');
            pythonProcess = spawn('python', [path.join(__dirname, '../automation_server.py')]);
        }
    }
}

app.on('ready', () => {
    startPythonServer();
    createWindow();

    // Auto-update only in packaged (production) builds
    if (app.isPackaged) {
        try {
            autoUpdater.checkForUpdatesAndNotify();
        } catch (e) {
            console.error('AutoUpdater error:', e);
        }
    }
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
