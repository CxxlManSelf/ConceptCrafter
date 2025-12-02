const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 給渲染進程
contextBridge.exposeInMainWorld('electronAPI', {
    // 取得應用程式所在目錄
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // 選擇資料夾
    selectFolder: () => ipcRenderer.invoke('select-folder'),

    // 選擇檔案
    selectFile: (options) => ipcRenderer.invoke('select-file', options),

    // 另存新檔對話框
    saveFileDialog: (defaultPath) => ipcRenderer.invoke('save-file-dialog', defaultPath),

    // 讀取資料夾內的檔案列表
    readFolder: (folderPath) => ipcRenderer.invoke('read-folder', folderPath),

    // 讀取檔案內容
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

    // 寫入檔案
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

    // 刪除檔案
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),

    // 檢查檔案是否存在
    fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),

    // 取得路徑分隔符號
    getPathSeparator: () => ipcRenderer.invoke('get-path-separator'),

    // 檢查是否在 Electron 環境中
    isElectron: true
});
