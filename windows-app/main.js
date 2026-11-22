const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');

const APP_VERSION_LABEL = 'ver Alpha';
const APP_SEMVER = '0.1.0-alpha';
const WEBSITE_BASE_URL = 'https://quintex-productio.github.io/sandy.io';
const LOCAL_SERVER_PORT = 47821;

let mainWindow = null;
let localServer = null;
let activePort = LOCAL_SERVER_PORT;
let pendingBluetoothCallback = null;

// Ensure recordings directory exists in userData
function getRecordingsDir() {
  const dir = path.join(app.getPath('userData'), 'sandy-recordings');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getRecordingsIndexPath() {
  return path.join(getRecordingsDir(), 'recordings-index.json');
}

function readRecordingsIndex() {
  const indexPath = getRecordingsIndexPath();
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeRecordingsIndex(items) {
  const indexPath = getRecordingsIndexPath();
  fs.writeFileSync(indexPath, JSON.stringify(items, null, 2), 'utf-8');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

/**
 * Localhost HTTP server serving the renderer & saved recordings.
 * Using http://localhost:<port> ensures Firebase Auth (Email + Google Sign-In)
 * and Web Bluetooth / Camera APIs run in a secure, Firebase-authorized origin.
 */
function startLocalServer() {
  return new Promise((resolve) => {
    const rendererDir = path.join(__dirname, 'renderer');
    const recordingsDir = getRecordingsDir();

    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url, true);
      let pathname = decodeURIComponent(parsed.pathname || '/');

      // OAuth / Website Firebase Auth callback bridge
      if (pathname === '/auth-callback') {
        const payload = parsed.query || {};
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auth:website-callback', payload);
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html><head><title>Sandy Auth Sync</title>
          <style>
            body { margin:0; height:100vh; display:flex; align-items:center; justify-content:center;
              background:#050814; color:#F8FAFC; font-family:system-ui,sans-serif; }
            .box { padding:28px 36px; border-radius:18px; border:1px solid rgba(0,240,255,0.4);
              background:rgba(10,15,30,0.92); text-align:center; box-shadow:0 0 40px rgba(0,240,255,0.18); }
            h2 { color:#00F0FF; margin:0 0 10px; }
            p { color:#94A3B8; margin:0; }
          </style></head>
          <body>
            <div class="box">
              <h2>Connected to Sandy Desktop</h2>
              <p>Your Firebase authentication has been synced. You can close this tab and return to Sandy.</p>
            </div>
            <script>setTimeout(() => window.close(), 1600);</script>
          </body></html>
        `);
        return;
      }

      // Serve saved local posture recordings (images & videos)
      if (pathname.startsWith('/recordings/')) {
        const safeName = path.basename(pathname.replace('/recordings/', ''));
        const filePath = path.join(recordingsDir, safeName);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      // Serve renderer static files
      if (pathname === '/') pathname = '/index.html';
      const safeRel = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
      const filePath = path.join(rendererDir, safeRel);

      if (filePath.startsWith(rendererDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.on('error', () => {
      // Fallback to any available ephemeral localhost port
      server.listen(0, '127.0.0.1', () => {
        activePort = server.address().port;
        localServer = server;
        resolve(activePort);
      });
    });

    server.listen(LOCAL_SERVER_PORT, '127.0.0.1', () => {
      activePort = LOCAL_SERVER_PORT;
      localServer = server;
      resolve(activePort);
    });
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1020,
    minHeight: 680,
    frame: false,
    backgroundColor: '#050814',
    title: 'Sandy',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Clean Chrome UA so Firebase & Google OAuth popups work cleanly
  const cleanUA = mainWindow.webContents.getUserAgent().replace(/Electron\/[^\s]+\s?/g, '');
  mainWindow.webContents.setUserAgent(cleanUA);

  // Grant camera, microphone, and Bluetooth permissions inside Sandy
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'mediaKeySystem', 'geolocation', 'notifications', 'bluetooth', 'hid', 'serial'];
    callback(allowed.includes(permission));
  });

  // Web Bluetooth device selection hook for Electron
  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    pendingBluetoothCallback = callback;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bluetooth:device-list', deviceList.map(d => ({
        deviceId: d.deviceId,
        deviceName: d.deviceName || 'Unnamed Bluetooth Device'
      })));
    }
  });

  // Allow Firebase Google Auth popups while opening regular external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    const isAuthPopup =
      targetUrl.includes('accounts.google.com') ||
      targetUrl.includes('firebaseapp.com/__/auth') ||
      targetUrl.includes('posturedection.firebaseapp.com') ||
      targetUrl.includes('quintex-productio.github.io/sandy.io');

    if (isAuthPopup) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          autoHideMenuBar: true,
          backgroundColor: '#050814',
          title: 'Sandy — Sign In',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
          }
        }
      };
    }
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.loadURL(`http://localhost:${activePort}/index.html`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', false);
  });
}

// ============================================================================
// IPC HANDLERS
// ============================================================================

ipcMain.handle('app:get-info', () => ({
  name: 'Sandy',
  versionLabel: APP_VERSION_LABEL,
  semver: APP_SEMVER,
  platform: process.platform,
  arch: process.arch,
  electron: process.versions.electron,
  node: process.versions.node,
  localOrigin: `http://localhost:${activePort}`,
  websiteBaseUrl: WEBSITE_BASE_URL,
  recordingsDir: getRecordingsDir()
}));

// Custom Frameless Titlebar Controls
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize-toggle', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// Website Firebase Auth Handoff Bridge
// Sends normal email sign-in / sign-up context to the Sandy website Firebase bridge
// or opens system browser Google Sign-In with callback to http://localhost:<port>/auth-callback
ipcMain.handle('auth:open-website-bridge', async (_event, payload) => {
  const mode = payload?.mode === 'signup' ? 'signup' : 'signin';
  const page = mode === 'signup' ? 'signup.html' : 'signin.html';
  const callbackUrl = encodeURIComponent(`http://127.0.0.1:${activePort}/auth-callback`);
  const bridgeUrl = `${WEBSITE_BASE_URL}/${page}?desktop_app=1&desktop_callback=${callbackUrl}`;

  if (payload?.useExternalBrowser) {
    await shell.openExternal(bridgeUrl);
    return { ok: true, mode, openedIn: 'browser', bridgeUrl };
  }

  // Background hidden sync ping to Sandy website bridge so website Firebase origin stays linked
  try {
    const bridgeWin = new BrowserWindow({
      width: 480,
      height: 620,
      show: Boolean(payload?.visible),
      autoHideMenuBar: true,
      backgroundColor: '#050814',
      title: 'Sandy — Website Firebase Connection',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    const cleanUA = bridgeWin.webContents.getUserAgent().replace(/Electron\/[^\s]+\s?/g, '');
    bridgeWin.webContents.setUserAgent(cleanUA);
    await bridgeWin.loadURL(bridgeUrl);

    if (!payload?.visible) {
      setTimeout(() => {
        if (!bridgeWin.isDestroyed()) bridgeWin.close();
      }, 2500);
    }
    return { ok: true, mode, openedIn: payload?.visible ? 'window' : 'background-bridge', bridgeUrl };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Bluetooth Device Selection Response
ipcMain.on('bluetooth:select-device', (_event, deviceId) => {
  if (typeof pendingBluetoothCallback === 'function') {
    pendingBluetoothCallback(deviceId || '');
    pendingBluetoothCallback = null;
  }
});

// Local Posture Media Recording Storage (Images + Videos for Report Tab)
ipcMain.handle('recordings:save', async (_event, item) => {
  try {
    const dir = getRecordingsDir();
    const id = item.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const isVideo = item.mediaType === 'video';
    const ext = isVideo ? '.webm' : '.jpg';
    const fileName = `${id}${ext}`;
    const filePath = path.join(dir, fileName);

    const base64Data = String(item.dataUrl || '').replace(/^data:[^;]+;base64,/, '');
    if (!base64Data) return { ok: false, error: 'Empty media payload' };

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const record = {
      id,
      mediaType: isVideo ? 'video' : 'image',
      fileName,
      url: `http://localhost:${activePort}/recordings/${fileName}`,
      timestamp: item.timestamp || Date.now(),
      dateKey: item.dateKey || new Date().toISOString().slice(0, 10),
      posture: item.posture || 'GOOD', // GOOD or BAD
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.92,
      deviceName: item.deviceName || 'Sandy Posture Cam',
      durationSec: item.durationSec || 0,
      uid: item.uid || 'local'
    };

    const list = readRecordingsIndex();
    list.unshift(record);
    // Keep up to 400 recent local recordings
    writeRecordingsIndex(list.slice(0, 400));

    return { ok: true, record };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('recordings:list', async (_event, uid) => {
  const list = readRecordingsIndex();
  const filtered = uid ? list.filter(r => !r.uid || r.uid === uid || r.uid === 'local') : list;
  return filtered.map(r => ({
    ...r,
    url: `http://localhost:${activePort}/recordings/${r.fileName}`
  }));
});

ipcMain.handle('recordings:delete', async (_event, id) => {
  const list = readRecordingsIndex();
  const target = list.find(r => r.id === id);
  if (target) {
    const filePath = path.join(getRecordingsDir(), target.fileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
  }
  const updated = list.filter(r => r.id !== id);
  writeRecordingsIndex(updated);
  return { ok: true };
});

ipcMain.handle('recordings:open-folder', async () => {
  await shell.openPath(getRecordingsDir());
  return { ok: true };
});

ipcMain.handle('system:open-external', async (_event, targetUrl) => {
  if (typeof targetUrl === 'string' && /^https?:\/\//i.test(targetUrl)) {
    await shell.openExternal(targetUrl);
    return { ok: true };
  }
  return { ok: false };
});

// Enable Web Bluetooth API flags in Chromium/Electron
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('enable-web-bluetooth');

app.whenReady().then(async () => {
  await startLocalServer();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (localServer) {
    try { localServer.close(); } catch (_) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
