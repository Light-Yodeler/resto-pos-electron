const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  load: () => ipcRenderer.invoke('data:load'),
  save: data => ipcRenderer.invoke('data:save', data),
  print: options => ipcRenderer.invoke('receipt:print', options),
  listPrinters: () => ipcRenderer.invoke('printer:list'),
  backupDatabase: data => ipcRenderer.invoke('database:backup', data),
  restoreDatabase: () => ipcRenderer.invoke('database:restore'),
  backupMenu: data => ipcRenderer.invoke('menu:backup', data),
  restoreMenu: () => ipcRenderer.invoke('menu:restore'),
  queryTransactions: options => ipcRenderer.invoke('transactions:query', options),
  updateTransaction: transaction => ipcRenderer.invoke('transactions:update', transaction),
  queryShifts: options => ipcRenderer.invoke('shifts:query', options)
});
