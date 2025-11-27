const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    launchGame: (path) => ipcRenderer.invoke('launch-game', path),
    selectFile: () => ipcRenderer.invoke('select-file'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    platform: process.platform,
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates')
});
