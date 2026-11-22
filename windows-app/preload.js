const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('SandyDesktop', true);

contextBridge.exposeInMainWorld('sandyAPI', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:maximize-toggle'),
  close: () => ipcRenderer.send('window:close'),
  onMaximizedChanged: (cb) => ipcRenderer.on('window:maximized-changed', (_e, val) => cb(val)),

  // Website Firebase Auth Bridge
  openWebsiteBridge: (payload) => ipcRenderer.invoke('auth:open-website-bridge', payload),
  onWebsiteAuthCallback: (cb) => ipcRenderer.on('auth:website-callback', (_e, data) => cb(data)),

  // Web Bluetooth selection bridge
  onBluetoothDeviceList: (cb) => ipcRenderer.on('bluetooth:device-list', (_e, list) => cb(list)),
  selectBluetoothDevice: (deviceId) => ipcRenderer.send('bluetooth:select-device', deviceId),

  // Local Recordings (Images & Videos for Reports)
  saveRecording: (item) => ipcRenderer.invoke('recordings:save', item),
  listRecordings: (uid) => ipcRenderer.invoke('recordings:list', uid),
  deleteRecording: (id) => ipcRenderer.invoke('recordings:delete', id),
  openRecordingsFolder: () => ipcRenderer.invoke('recordings:open-folder'),

  // External link helper
  openExternal: (url) => ipcRenderer.invoke('system:open-external', url)
});
