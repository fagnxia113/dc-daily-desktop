const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  addBizFromUrl: (url) => ipcRenderer.invoke('config:addBizFromUrl', url),
  removeBiz: (biz) => ipcRenderer.invoke('config:removeBiz', biz),
  runJob: (payload) => ipcRenderer.invoke('job:run', payload)
});
