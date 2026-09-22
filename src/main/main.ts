import { app, BrowserWindow, protocol, net } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipcHandlers';
import { checkConnection } from '../db/connection';

// Register scheme privileges before app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'local-resource', privileges: { secure: true, supportFetchAPI: true, standard: true, stream: true, bypassCSP: true } }
]);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
        },
    });

    // Check DB connection on start
    checkConnection();

    // Register IPC
    registerIpcHandlers();

    // Load the index.html of the app.
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else if (!app.isPackaged) {
        // Fallback for dev mode where 'electronmon' doesn't pass the env
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
};

app.on('ready', () => {
    protocol.handle('local-resource', (request) => {
        const fileUrl = request.url.replace(/^local-resource:/, 'file:');
        try {
            return net.fetch(fileUrl);
        } catch (error) {
            console.error('Failed to fetch local resource:', fileUrl, error);
            return new Response('Not Found', { status: 404 });
        }
    });
    createWindow();
});

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
